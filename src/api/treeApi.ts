import apiClient from './axiosConfig';

export interface Tree {
  id: number;
  treeName: string;
  scientificName: string;
  description: string;
  harvestDays: number;
  minRentalDays: number;
  price: number;
  priceSmall?: number;
  priceMedium?: number;
  priceLarge?: number;
  imageUrl?: string | null;

  soilMoistureMin: number;
  soilMoistureMax: number;
  lightMin: number;
  lightMax: number;
  phMin: number;
  phMax: number;
  compensationPercentage: number;
  careInstructions: string;
  isActive: boolean;
}

export const treeApi = {
  getTrees: (): Promise<Tree[]> => 
    apiClient.get('/trees').then(r => r.data),
  
  getTree: (id: number): Promise<Tree> => 
    apiClient.get(`/trees/${id}`).then(r => r.data),
  
  createTree: (data: Partial<Tree>): Promise<Tree> => 
    apiClient.post('/trees', data).then(r => r.data),
  
  updateTree: (id: number, data: Partial<Tree>): Promise<Tree> => 
    apiClient.put(`/trees/${id}`, data).then(r => r.data),
  
  deleteTree: (id: number): Promise<any> =>
    apiClient.delete(`/trees/${id}`).then(r => r.data),

  forceDeleteTree: (id: number): Promise<any> =>
    apiClient.delete(`/trees/${id}/force`).then(r => r.data),
};