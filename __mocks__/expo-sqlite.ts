const mockDb = {
  getAllAsync: jest.fn().mockResolvedValue([]),
  getFirstAsync: jest.fn().mockResolvedValue(null),
  execAsync: jest.fn().mockResolvedValue(undefined),
  closeAsync: jest.fn().mockResolvedValue(undefined),
};

export const openDatabaseAsync = jest.fn().mockResolvedValue(mockDb);
export const __mockDb = mockDb;
