// Data service for providing sample data to widgets
class DataService {
  constructor() {
    this.sampleData = {
      sales: [
        { month: 'Jan', sales: 400, profit: 240, orders: 120 },
        { month: 'Feb', sales: 300, profit: 139, orders: 98 },
        { month: 'Mar', sales: 200, profit: 980, orders: 156 },
        { month: 'Apr', sales: 278, profit: 390, orders: 89 },
        { month: 'May', sales: 189, profit: 480, orders: 234 },
        { month: 'Jun', sales: 239, profit: 380, orders: 167 },
        { month: 'Jul', sales: 349, profit: 430, orders: 198 },
        { month: 'Aug', sales: 400, profit: 520, orders: 245 },
      ],
      users: [
        { id: 1, name: 'John Doe', email: 'john@example.com', status: 'Active', lastLogin: '2024-01-15' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'Active', lastLogin: '2024-01-14' },
        { id: 3, name: 'Bob Johnson', email: 'bob@example.com', status: 'Inactive', lastLogin: '2024-01-10' },
        { id: 4, name: 'Alice Brown', email: 'alice@example.com', status: 'Active', lastLogin: '2024-01-16' },
        { id: 5, name: 'Charlie Wilson', email: 'charlie@example.com', status: 'Active', lastLogin: '2024-01-13' },
        { id: 6, name: 'Diana Davis', email: 'diana@example.com', status: 'Inactive', lastLogin: '2024-01-08' },
        { id: 7, name: 'Edward Miller', email: 'edward@example.com', status: 'Active', lastLogin: '2024-01-16' },
        { id: 8, name: 'Fiona Garcia', email: 'fiona@example.com', status: 'Active', lastLogin: '2024-01-15' },
      ],
      products: [
        { id: 1, name: 'Product A', category: 'Electronics', price: 299, stock: 45, sales: 120 },
        { id: 2, name: 'Product B', category: 'Clothing', price: 89, stock: 120, sales: 89 },
        { id: 3, name: 'Product C', category: 'Books', price: 25, stock: 200, sales: 234 },
        { id: 4, name: 'Product D', category: 'Electronics', price: 599, stock: 15, sales: 67 },
        { id: 5, name: 'Product E', category: 'Clothing', price: 129, stock: 80, sales: 156 },
        { id: 6, name: 'Product F', category: 'Books', price: 35, stock: 150, sales: 98 },
        { id: 7, name: 'Product G', category: 'Electronics', price: 199, stock: 60, sales: 145 },
        { id: 8, name: 'Product H', category: 'Clothing', price: 79, stock: 95, sales: 78 },
      ],
      metrics: {
        totalRevenue: 125000,
        totalOrders: 1247,
        activeUsers: 892,
        conversionRate: 3.2,
        averageOrderValue: 100.2,
        customerSatisfaction: 4.6,
      },
    };
  }

  // Get data by source name
  async getData(source) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    switch (source) {
      case 'sales':
        return this.sampleData.sales;
      case 'users':
        return this.sampleData.users;
      case 'products':
        return this.sampleData.products;
      case 'metrics':
        return this.sampleData.metrics;
      default:
        return this.sampleData.sales; // Default fallback
    }
  }

  // Get specific metric
  async getMetric(metricName) {
    await new Promise(resolve => setTimeout(resolve, 50));
    return this.sampleData.metrics[metricName] || 0;
  }



  // Get chart data with filters
  async getChartData(source, filters = {}) {
    const data = await this.getData(source);
    
    if (filters.limit) {
      return data.slice(0, filters.limit);
    }
    
    return data;
  }

  // Get table data with pagination
  async getTableData(source, page = 0, pageSize = 10, filters = {}) {
    const data = await this.getData(source);
    
    let filteredData = data;
    
    // Apply filters
    if (filters.search) {
      filteredData = data.filter(item => 
        Object.values(item).some(value => 
          String(value).toLowerCase().includes(filters.search.toLowerCase())
        )
      );
    }
    
    const startIndex = page * pageSize;
    const endIndex = startIndex + pageSize;
    
    return {
      data: filteredData.slice(startIndex, endIndex),
      total: filteredData.length,
      page,
      pageSize,
    };
  }
}

export default new DataService(); 