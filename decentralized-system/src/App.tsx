import axios from 'axios';
import React, { ChangeEvent, useState } from 'react';
import './App.css';

interface Item {
  name: string;
  type: 'folder' | 'file';
  date: string;
  location: string;
}

const App: React.FC = () => {
  const [items, setItems] = useState<Item[]>([
    { name: "Colab Notebooks", type: "folder", date: "2024-11-15", location: "In My Drive" },
    { name: "Document.pdf", type: "file", date: "2024-11-13", location: "In My Drive" },
    { name: "Presentation.pptx", type: "file", date: "2024-11-12", location: "In My Drive" },
    { name: "Photos", type: "folder", date: "2024-11-14", location: "In My Drive" },
    { name: "Video.mp4", type: "file", date: "2024-11-11", location: "In My Drive" },
    { name: "ECS 189F notes.txt", type: "file", date: "2024-11-10", location: "In My Drive" },
    { name: "Music.mp3", type: "file", date: "2024-11-09", location: "In My Drive" },
  ]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortType, setSortType] = useState<string>("default");
  const [fileTypeFilter, setFileTypeFilter] = useState<string>("");

  //Upload handle

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
  
    if (!uploadedFile) return;
  
    const formData = new FormData();
    formData.append('file', uploadedFile);
    formData.append('owner_name', 'Test Owner');  // Dummy
    formData.append('owner_public_key', 'public_key_xyz');
    formData.append('owner_private_key', 'private_key_xyz');
  
    try {
      console.log('Uploading file:', uploadedFile.name, uploadedFile.type);

      const response = await axios.post(
        'https://resilientfilesbackend.onrender.com/upload_and_store/',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      alert(`File uploaded successfully: ${JSON.stringify(response.data)}`);

    } catch (error: any) {
      console.error('Error uploading file:', error);
  
      if (error.response) {
        alert(`Error: ${JSON.stringify(error.response.data)}`);
      } else {
        alert(`Error: ${error.message}`);
      }
    }
  };

  // Sorting

  const filterAndSortItems = (): Item[] => {
    let filteredItems = [...items];

    if (searchQuery) {
      filteredItems = filteredItems.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    switch (sortType) {
      case "folders":
        filteredItems = filteredItems.filter((item) => item.type === "folder");
        break;
      case "files":
        filteredItems = filteredItems.filter((item) => item.type === "file");
        break;
      case "recent":
        filteredItems = filteredItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        break;
      default:
        break;
    }

    if (fileTypeFilter) {
      filteredItems = filteredItems.filter(
        (item) => item.type === "file" && item.name.endsWith(fileTypeFilter)
      );
    }

    return filteredItems;
  };

  const filteredItems = filterAndSortItems();

  return (
    <div className="App">
      <header className="app-header">
        <h1>My Drive</h1>
      </header>
      <div className="app-container">
        {/* Sidebar */}
        <aside className="sidebar">
          <ul className="sidebar-menu">
            <li className="menu-item active">My Drive</li>
            <li className="menu-item">Shared with Me</li>
            <li className="menu-item">Recent</li>
            <li className="menu-item">Trash</li>
          </ul>
        </aside>

        {/* Main Content */}
        <div className="main-content">
          <div className="controls">
            <input
              type="text"
              placeholder="Search files and folders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-bar"
            />
            <label htmlFor="sort">Sort by:</label>
            <select
              id="sort"
              value={sortType}
              onChange={(e) => setSortType(e.target.value)}
            >
              <option value="default">Default</option>
              <option value="folders">Folders</option>
              <option value="files">Files</option>
              <option value="recent">Recent</option>
            </select>
            <label htmlFor="fileType">File type:</label>
            <select
              id="fileType"
              value={fileTypeFilter}
              onChange={(e) => setFileTypeFilter(e.target.value)}
            >
              <option value="">All</option>
              <option value=".pdf">.pdf</option>
              <option value=".txt">.txt</option>
              <option value=".mp4">.mp4</option>
              <option value=".mp3">.mp3</option>
              <option value=".pptx">.pptx</option>
            </select>
          </div>
          <div className="items">
            <table className="file-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Date Modified</th>
                  <th>Location</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item, index) => (
                  <tr key={index}>
                    <td>{item.type === "folder" ? "📁" : "📄"} {item.name}</td>
                    <td>{item.type}</td>
                    <td>{item.date}</td>
                    <td>{item.location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="upload-button-container">
            <input
              type="file"
              id="file-upload"
              onChange={handleFileUpload}
              hidden
            />
            <label htmlFor="file-upload" className="upload-button">
              + Upload File
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
