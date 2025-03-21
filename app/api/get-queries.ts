// api.ts

export interface CustomerTicket {
    "Customer ID": string;
    "Name": string;
    "Channel": string;
    "Subject": string;
    "Query": string;
    "Solution": string;
    "Solveable": "Yes" | "No";
    "Priority": "High" | "Medium" | "Low";
    "Department": string;
    "Language": string;
  }
  
  export const fetchCustomerTickets = async (): Promise<CustomerTicket[]> => {
    try {
      const API_URL = "https://script.google.com/macros/s/AKfycbx78BiN6JSlXt2alnGUoNeXOKH58E9UuAPp-RtgIt92KxYG4339IFeVfD4HKBHVIcOJ/exec?action=get";
      
      const response = await fetch(API_URL, {
        method: "GET",
        // Remove unnecessary headers for GET request
        // Add CORS mode to handle cross-origin requests
        mode: 'cors'
      });
  
      // Handle network errors
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      // Verify content type before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        throw new Error("Received non-JSON response");
      }
  
      const data: CustomerTicket[] = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching customer tickets:", error);
      throw new Error("Failed to load customer tickets. Please check your connection and try again.");
    }
  };

  export const fetchLatestCustomerTicket = async (): Promise<CustomerTicket> => {
    try {
      const API_URL = "https://script.google.com/macros/s/AKfycbz3bHnGD89pdyxWYHLNX001H2fhNh-nIqFC92KVHHWfbMRWD4tXpQYgJbmlaXegzvZS/exec?action=getLast";
      
      const response = await fetch(API_URL, {
        method: "GET",
        mode: 'cors'
      });
      
      // Handle network errors
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Verify content type before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        throw new Error("Received non-JSON response");
      }
      
      const data: CustomerTicket = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching latest customer ticket:", error);
      throw new Error("Failed to load latest customer ticket. Please check your connection and try again.");
    }
  };
