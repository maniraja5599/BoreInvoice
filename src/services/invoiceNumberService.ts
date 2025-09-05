// Invoice Number Generation Service
class InvoiceNumberService {
  private readonly STORAGE_KEY = 'anjaneya_invoice_counter';

  // Generate a short, unique invoice number
  generateInvoiceNumber(): string {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2); // Last 2 digits of year
    const month = (now.getMonth() + 1).toString().padStart(2, '0'); // Month with leading zero
    
    // Get the next sequence number for this year-month
    const sequenceNumber = this.getNextSequenceNumber(year, month);
    
    // Format: YYMM-XXX (e.g., 2501-001, 2501-002, etc.)
    return `${year}${month}-${sequenceNumber.toString().padStart(3, '0')}`;
  }

  // Get the next sequence number for a specific year-month
  private getNextSequenceNumber(year: string, month: string): number {
    const key = `${year}${month}`;
    
    try {
      const counters = this.getCounters();
      const currentCount = counters[key] || 0;
      const nextCount = currentCount + 1;
      
      // Update the counter
      counters[key] = nextCount;
      this.saveCounters(counters);
      
      return nextCount;
    } catch (error) {
      console.error('Error generating sequence number:', error);
      // Fallback to timestamp-based number
      return Date.now() % 1000;
    }
  }

  // Get all counters from localStorage
  private getCounters(): { [key: string]: number } {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error loading invoice counters:', error);
      return {};
    }
  }

  // Save counters to localStorage
  private saveCounters(counters: { [key: string]: number }): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(counters));
    } catch (error) {
      console.error('Error saving invoice counters:', error);
    }
  }

  // Get invoice statistics
  getInvoiceStats(): { [key: string]: number } {
    return this.getCounters();
  }

  // Reset counters (for testing or admin purposes)
  resetCounters(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Error resetting invoice counters:', error);
    }
  }

  // Get current month's invoice count
  getCurrentMonthCount(): number {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const key = `${year}${month}`;
    
    const counters = this.getCounters();
    return counters[key] || 0;
  }

  // Get all months with invoice counts
  getAllMonthCounts(): Array<{ month: string; count: number; display: string }> {
    const counters = this.getCounters();
    const months = Object.keys(counters).map(key => {
      const year = key.slice(0, 2);
      const month = key.slice(2, 4);
      const fullYear = `20${year}`;
      const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ];
      
      return {
        month: key,
        count: counters[key],
        display: `${monthNames[parseInt(month) - 1]} ${fullYear}`
      };
    });
    
    // Sort by month (newest first)
    return months.sort((a, b) => b.month.localeCompare(a.month));
  }
}

// Export singleton instance
export const invoiceNumberService = new InvoiceNumberService();
