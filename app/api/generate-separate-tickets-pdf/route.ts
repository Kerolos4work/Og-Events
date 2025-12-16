import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { bookingId } = await request.json();

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Fetch booking details with seat categories
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(
        `
                id,
                name,
                email,
                phone,
                amount,
                status,
                created_at,
                seats (
                    id,
                    seat_number,
                    status,
                    category,
                    rows (
                        row_number,
                        zones (
                            name
                        )
                    )
                )
            `
      )
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Get venue data with categories and templates
    const { data: venuesData, error: venuesError } = await supabase
      .from('venues')
      .select('categories')
      .limit(1);

    if (venuesError || !venuesData || venuesData.length === 0) {
      console.error('Error fetching venues:', venuesError);
      return NextResponse.json({ error: 'Failed to fetch venue data' }, { status: 500 });
    }

    const categories = venuesData[0].categories || [];

    // Generate an array of HTML documents, one for each ticket
    const ticketHtmls = booking.seats.map((seat, index) => {
      // Find category and template for this seat
      const seatCategory = seat.category; // Use seat category if available, fallback to zone name
      const category = categories.find((cat: any) => cat.name === seatCategory);

      // Default template if no specific template is found
      let template = {
        ticketSize: { width: 600, height: 300 },
        ticketElements: {
          backgroundImage: { x: 0, y: 0, width: 600, height: 300, visible: true },
          qrCode: { x: 400, y: 50, width: 150, height: 150, visible: true },
          customTexts: [],
        },
        backgroundImageUrl: null,
      };

      // Use first template from category if available
      if (category && category.templates && category.templates.length > 0) {
        template = category.templates[0];
      }

      // Generate QR code URL with seat ID and color parameters from template
      let qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${seat.id}`;

      // Check if template has QR code URL with color parameters
      if (template.ticketElements && template.ticketElements.qrCode && template.ticketElements.qrCode.visible) {
        // Extract color parameters from template QR code URL
        // Generate default QR code URL with color parameters
        const templateQrUrl = new URL(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${seat.id}`);
        const colorParam = templateQrUrl.searchParams.get('color');
        const bgcolorParam = templateQrUrl.searchParams.get('bgcolor');

        // Add color parameters to our QR code URL
        if (colorParam) {
          qrCodeUrl += `&color=${colorParam}`;
        }

        if (bgcolorParam) {
          qrCodeUrl += `&bgcolor=${bgcolorParam}`;
        }
      }

      // Generate custom texts
      const customTextsHtml = template.ticketElements.customTexts
        .map((text: any) => {
          const style = `
                    position: absolute;
                    left: ${text.position.x}px;
                    top: ${text.position.y}px;
                    width: ${text.position.width}px;
                    height: ${text.position.height}px;
                    font-size: ${text.position.fontSize}px;
                    color: ${text.position.fontColor};
                    font-family: ${text.position.fontFamily};
                    font-style: ${text.position.fontStyle || 'normal'};
                    font-weight: ${text.position.fontWeight || 'normal'};
                    text-align: ${text.position.textAlign || 'left'};
                    line-height: ${text.position.lineHeight || 1.5};
                    text-shadow: ${text.position.textShadowX || 0}px ${text.position.textShadowY || 0}px ${text.position.textShadowBlur || 0}px ${text.position.textShadowColor || 'transparent'};
                    letter-spacing: ${text.position.letterSpacing || 0}px;
                    text-transform: ${text.position.textTransform || 'none'};
                    text-decoration: ${text.position.textDecoration || 'none'};
                    background-color: ${text.position.backgroundColor}${text.position.backgroundOpacity !== undefined
              ? Math.round(text.position.backgroundOpacity * 255)
                .toString(16)
                .padStart(2, '0')
              : ''
            };
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 3;
                `;

          // Replace placeholders in text content
          let content = text.content;
          // Helper to get row and zone safely
          const rowData = Array.isArray(seat.rows) ? seat.rows[0] : seat.rows;
          const zoneData = Array.isArray(rowData?.zones) ? rowData.zones[0] : rowData?.zones;

          content = content.replace('{ZONE}', zoneData?.name || '');
          content = content.replace('{ROW}', rowData?.row_number || '');
          content = content.replace('{SEAT}', seat.seat_number);
          content = content.replace('{NAME}', booking.name);
          content = content.replace('{EMAIL}', booking.email);
          content = content.replace('{PHONE}', booking.phone);
          content = content.replace('{PRICE}', (booking.amount / booking.seats.length).toString());
          content = content.replace('{BOOKING_ID}', booking.id.substring(0, 8));

          return `<div style="${style}">${content}</div>`;
        })
        .join('');

      // Create a complete HTML document for this ticket
      const htmlDocument = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <title>Ticket ${index + 1}</title>
                    <style>
                        @page {
                            size: ${template.ticketSize.width}px ${template.ticketSize.height}px;
                            margin: 0;
                        }
                        body {
                            margin: 0;
                            padding: 0;
                            font-family: Arial, sans-serif;
                            width: ${template.ticketSize.width}px;
                            height: ${template.ticketSize.height}px;
                            overflow: hidden;
                        }
                        html {
                            margin: 0;
                            padding: 0;
                            width: ${template.ticketSize.width}px;
                            height: ${template.ticketSize.height}px;
                        }
                    </style>
                </head>
                <body>
                    <div style="position: relative; width: ${template.ticketSize.width}px; height: ${template.ticketSize.height}px; overflow: hidden;">
                        ${template.backgroundImageUrl
          ? `<img src="${template.backgroundImageUrl}" style="position: absolute; left: ${template.ticketElements.backgroundImage.x}px; top: ${template.ticketElements.backgroundImage.y}px; width: ${template.ticketElements.backgroundImage.width}px; height: ${template.ticketElements.backgroundImage.height}px; z-index: 0;" />`
          : ''
        }
                        ${template.ticketElements.qrCode.visible
          ? `<img src="${qrCodeUrl}" style="position: absolute; left: ${template.ticketElements.qrCode.x}px; top: ${template.ticketElements.qrCode.y}px; width: ${template.ticketElements.qrCode.width}px; height: ${template.ticketElements.qrCode.height}px; z-index: 2;" />`
          : ''
        }
                        ${customTextsHtml}
                    </div>
                </body>
                </html>
            `;

      return {
        html: htmlDocument,
        filename: `${booking.name.replace(/\s+/g, '-')}-${(Array.isArray(seat.rows) ? seat.rows[0] : seat.rows)?.zones?.[0]?.name || 'zone'
          }-${(Array.isArray(seat.rows) ? seat.rows[0] : seat.rows)?.row_number || 'row'}-${seat.seat_number}.html`,
      };
    });

    // Return the array of HTML documents
    return NextResponse.json({
      tickets: ticketHtmls,
      bookingId: bookingId,
    });
  } catch (error: any) {
    console.error('Error generating separate tickets:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
