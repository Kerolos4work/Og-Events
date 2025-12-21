// Utility functions to manage order IDs in localStorage

const ORDER_IDS_STORAGE_KEY = 'userOrderIds';

// Add an order ID to list in localStorage
export const addOrderId = (orderId: string): void => {
  if (typeof window !== 'undefined') {
    try {
      // Get existing order IDs
      const existingOrderIds = JSON.parse(localStorage.getItem(ORDER_IDS_STORAGE_KEY) || '[]');

      // Check if ID already exists
      if (!existingOrderIds.includes(orderId)) {
        // Add new ID
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

// Remove an order ID from list in localStorage
export const removeOrderId = (orderId: string): void => {
  if (typeof window !== 'undefined') {
    try {
      // Get existing order IDs
      const existingOrderIds = JSON.parse(localStorage.getItem(ORDER_IDS_STORAGE_KEY) || '[]');

      // Filter out ID to remove
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

// Validate order IDs against the database and return only valid ones
// This function will NOT automatically update localStorage
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
      // Extract the IDs from the returned bookings
      const validIds = data.bookings.map((booking: any) => booking.id);
      return validIds;
    } else {
      // If there's an error, return original IDs
      return orderIds;
    }
  } catch (error) {
    console.error('Error validating order IDs:', error);
    // If there's an error, return original IDs
    return orderIds;
  }
};

// Function to remove invalid IDs from localStorage
// This should only be called explicitly when needed
export const removeInvalidOrderIds = async (): Promise<void> => {
  const orderIds = getOrderIds();
  if (orderIds.length === 0) return;

  try {
    // Get valid IDs from the database
    const validIds = await validateOrderIds(orderIds);

    // Find IDs that are in localStorage but not in the database
    const invalidIds = orderIds.filter(id => !validIds.includes(id));

    // Remove invalid IDs one by one
    invalidIds.forEach(id => removeOrderId(id));
  } catch (error) {
    console.error('Error removing invalid order IDs:', error);
  }
};
