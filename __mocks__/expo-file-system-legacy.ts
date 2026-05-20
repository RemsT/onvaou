export const documentDirectory = '/mock/documents/';

export const getInfoAsync = jest.fn().mockResolvedValue({ exists: true, isDirectory: false });
export const readAsStringAsync = jest.fn().mockResolvedValue('');
export const writeAsStringAsync = jest.fn().mockResolvedValue(undefined);
export const makeDirectoryAsync = jest.fn().mockResolvedValue(undefined);
export const downloadAsync = jest.fn().mockResolvedValue({ status: 200 });
export const deleteAsync = jest.fn().mockResolvedValue(undefined);
