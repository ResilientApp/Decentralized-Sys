import axios from 'axios';

const BASE_URL = 'https://resilientfilesbackend.onrender.com';

export const uploadAndStore = async (file: File): Promise<any> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axios.post(`${BASE_URL}/upload_and_store/`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};
