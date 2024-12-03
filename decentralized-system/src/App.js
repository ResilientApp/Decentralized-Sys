import React, { useState } from 'react';
import './App.css';

function App() {
  const [items, setItems] = useState([
    { name: "Colab Notebooks", type: "folder", date: "2024-11-15", location: "In My Drive" },
    { name: "Document.pdf", type: "file", date: "2024-11-13", location: "In My Drive" },
    { name: "Presentation.pptx", type: "file", date: "2024-11-12", location: "In My Drive" },
    { name: "Photos", type: "folder", date: "2024-11-14", location: "In My Drive" },
    { name: "Video.mp4", type: "file", date: "2024-11-11", location: "In My Drive" },
    { name: "ECS 189F notes.txt", type: "file", date: "2024-11-10", location: "In My Drive" },
    { name: "Music.mp3", type: "file", date: "2024-11-09", location: "In My Drive" },
  ]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortType, setSortType] = useState("default");
  const [fileTypeFilter, setFileTypeFilter] = useState("");

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile) {
      const today = new Date().toISOString().split("T")[0];
      setItems([...items, { name: uploadedFile.name, type: "file", date: today, location: "In My Drive" }]);
    }
  };

  const filterAndSortItems = () => {
    let filteredItems = items;

    // search query
    if (searchQuery) {
      filteredItems = filteredItems.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // sorting stuff
    switch (sortType) {
      case "folders":
        filteredItems = filteredItems.filter((item) => item.type === "folder");
        break;
      case "files":
        filteredItems = filteredItems.filter((item) => item.type === "file");
        break;
      case "recent":
        filteredItems = filteredItems.sort((a, b) => new Date(b.date) - new Date(a.date));
        break;
      default:
        break;
    }

    // file type sorting
    if (fileTypeFilter) {
      filteredItems = filteredItems.filter((item) => item.type === "file" && item.name.endsWith(fileTypeFilter));
    }

    return filteredItems;
  };

  const filteredItems = filterAndSortItems();

  return (
    <div className="App">
      <header className="app-header">
        <h1>My Drive</h1>
      </header>
      <div className="content">
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
  );
}

export default App;