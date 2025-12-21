// Utility functions to manage order IDs in localStorage

const ORDER_IDS_STORAGE_KEY = 'userOrderIds';

// Add an order ID to the list in localStorage
export const addOrderId = (orderId: string): void => {
  if (typeof window !== 'undefined') {
    try {
      // Get existing order IDs
      const existingOrderIds = JSON.parse(localStorage.getItem(ORDER_IDS_STORAGE_KEY) || '[]');

      // Check if the ID already exists
      if (!existingOrderIds.includes(orderId)) {
        // Add the new ID
        existingOrderIds.push(orderId);
        // Save back to localStorage
        localStorage.setItem(ORDER_IDS_STORAGE_KEY, JSON.stringify(existingOrderIds));
      }
    } catch (error) {
      console.error('Error adding order ID:', error);
      // If there's an error, start with a new array containing just this ID
      localStorage.setItem(ORDER_IDS_STORAGE_KEY, JSON.stringify([orderId]));
    }
  }
};

// Remove an order ID from the list in localStorage
export const removeOrderId = (orderId: string): void => {
  if (typeof window !== 'undefined') {
    try {
      // Get existing order IDs
      const existingOrderIds = JSON.parse(localStorage.getItem(ORDER_IDS_STORAGE_KEY) || '[]');

      // Filter out the ID to remove
      const updatedOrderIds = existingOrderIds.filter((id: string) => id !== orderId);

      // Save back to localStorage
      localStorage.setItem(ORDER_IDS_STORAGE_KEY, JSON.stringify(updatedOrderIds));
    } catch (error) {
      console.error('Error removing order ID:', error);
    }
  }
};

// Get all order IDs from localStorage
export const getOrderIds = (): string[] => {
  if (typeof window !== 'undefined') {
    try {
      return JSON.parse(localStorage.getItem(ORDER_IDS_STORAGE_KEY) || '[]');
    } catch (error) {
      console.error('Error getting order IDs:', error);
      return [];
    }
  }
  return [];
};

// Validate order IDs against the database and remove any that don't exist
export const validateOrderIds = async (orderIds: string[]): Promise<string[]> => {
  if (orderIds.length === 0) return [];

  try {
    // Check each order ID against the database using our new API endpoint
    const response = await fetch('/api/get-bookings-by-ids', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ orderIds }),
    });

    if (response.ok) {
      const data = await response.json();
      // Extract IDs from returned bookings
      const validIds = data.bookings.map((booking: any) => booking.id);

      // Update localStorage with only the valid IDs
      localStorage.setItem(ORDER_IDS_STORAGE_KEY, JSON.stringify(validIds));

      return validIds;
    } else {
      // If there's an error, return the original IDs
      return orderIds;
    }
  } catch (error) {
    console.error('Error validating order IDs:', error);
    // If there's an error, return the original IDs
    return orderIds;
  }
};
