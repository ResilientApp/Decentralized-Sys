import axios from 'axios';
import React, { ChangeEvent, useState } from 'react';
import './App.css';
import { ResilientDB } from 'resilientdb-javascript-sdk';
import * as path from 'path';
import * as fs from 'fs';

// Generate public and private keys
const { publicKey, privateKey } = ResilientDB.generateKeys();


console.log(`Public Key: ${publicKey}`);
console.log(`Private Key: ${privateKey}`);

interface Item {
  name: string;
  type: string;
  date: string;
  owner: string;
  transacID: string;
  publicKey: string;
}


const App: React.FC = () => {
  const [ownerName, setOwnerName] = useState("Unnamed Owner");
  const [items, setItems] = useState<Item[]>([
    { name: "Colab Notebooks", type: "folder", date: "2024-11-15", owner: "Test", transacID: "1", publicKey: publicKey },
    { name: "Document.pdf", type: "file", date: "2024-11-13", owner: "Test", transacID: "1", publicKey: publicKey },
    { name: "Presentation.pptx", type: "file", date: "2024-11-12", owner: "Test", transacID: "1", publicKey: publicKey },
    { name: "Photos", type: "folder", date: "2024-11-14", owner: "Test", transacID: "1", publicKey: publicKey },
    { name: "Video.mp4", type: "file", date: "2024-11-11", owner: "Test", transacID: "1", publicKey: publicKey },
    { name: "ECS 189F notes.txt", type: "file", date: "2024-11-10", owner: "Test", transacID: "1", publicKey: publicKey },
    { name: "Music.mp3", type: "file", date: "2024-11-09", owner: "Test", transacID: "1", publicKey: publicKey },
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
    formData.append('owner_name', ownerName);
    formData.append('owner_public_key', publicKey);
    formData.append('owner_private_key', privateKey);
  
    try {
      console.log('Uploading file:', uploadedFile.name, uploadedFile.type);

      const response = await axios.post(
        'https://resilientfilesapi.onrender.com/upload_and_store/',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          }
        }
      );


      alert('File uploaded successfully.');
      console.log(`File Upload Response: ${JSON.stringify(response.data)}`);

      
      const currentDate = new Date();

      //type: uploadedFile.type

      const responseMsg = response.data.message
      // We'll parse out the transaction ID from the API response message
      const noEdgeSpaces = responseMsg.trim();

      const messageWords = noEdgeSpaces.split(' ');

      const transactionID = messageWords.pop(); 

      console.log(transactionID);

      const newElement:Item = { name: uploadedFile.name, type: uploadedFile.type, date: currentDate.toDateString(), owner: ownerName, transacID: transactionID, publicKey: publicKey }

      setItems([...items, newElement]);


    } catch (error: any) {
      console.error('Error uploading file:', error);
      if (error.response) {
        alert(`Error: ${JSON.stringify(error.response.data)}`);
      } else {
        alert(`Error: ${error.message}`);
      }
    }
  };

  const handleFileRetrieval = async (inp: string) => {
    const givenTransactionID = inp;
  
    if (!givenTransactionID) return;
  
  
    try {
      console.log('Attempting to retrieve file with Transaction ID:', givenTransactionID);

      const response = await axios.post(
        `https://resilientfilesapi.onrender.com/retrieve_file/?tx_id=${givenTransactionID}`
      );


      alert(`File retrieved successfully: ${JSON.stringify(response.data)}`);

      console.log(`File retrieved successfully: ${response.data}`);
      
      //const currentDate = new Date();


      const transac = await axios.get(`https://crow.resilientdb.com/v1/transactions/${givenTransactionID}`);
      console.log(transac);
      console.log(transac.data);
      console.log(transac.data.asset);
      //const nameExample = "Retrieved File " + givenTransactionID[0] + givenTransactionID[1];

      //console.log(response.data.media_type)

      //const transac = await resilientDBClient.getTransaction(givenTransactionID);

      //console.log(transac)

      //const transac = transacs[1]


      const retrievedMetadata = transac.data.asset;

      const transacPublicKey = retrievedMetadata.owner_key;
      //const transacPublicKey = "0";
      
      const fileName = retrievedMetadata.data.file_info.file_name;
      //const fileName = "Retrieved File " + givenTransactionID[0] + givenTransactionID[1];

      const ownerName = retrievedMetadata.data.file_info.owner_name;
      //const ownerName = "Unnamed Owner";

      const fileType = retrievedMetadata.data.file_info.file_type;
      //const fileType = "file";

      const lastMod = retrievedMetadata.data.file_info.modification_time;

      const newElement:Item = { name: fileName, type: fileType, date: lastMod, owner: ownerName, transacID: givenTransactionID, publicKey: transacPublicKey }

      setItems([...items, newElement]);

    } catch (error: any) {
      console.error('Error retrieving file:', error);
      if (error.response) {
        alert('Please Enter a Valid Transaction ID');
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

  const [showInputOwnerName, setShowInputOwnerName] = useState(false);
  const [tempOwnerName, setTempOwnerName] = useState('');

  const [showInput, setShowInput] = useState(false);
  const [text, setText] = useState('');
  
  return (
    
    <div className="App">
      <header className="app-header">
        <h1>{ownerName}'s Drive</h1>
        <div className="owner-name-change-container">
            {showInputOwnerName && (
              <input 
                type="text"
                value={tempOwnerName}
                id="name-change-input"
                onChange={(e) =>  {
                  setTempOwnerName((e.target.value).replace(/[^a-z A-Z]/g, ''));
                  // Using a regular expression here that makes sure only letters are inputted into the text box (names only need to contain letters)
                }} 
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && tempOwnerName.trim() !== '') {
                    setOwnerName(tempOwnerName);
                    setShowInputOwnerName(false);
                  }
                }}
                placeholder= "Press Enter to Submit"
              />
            )}
            {!showInputOwnerName && (
            <button className="name-change-button" onClick={() => setShowInputOwnerName(!showInput)}>Change Name</button>
            )}
          </div>
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
                  <th>File Type</th>
                  <th>Date Uploaded</th>
                  <th>Owner</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item, index) => (
                  <tr key={index}>
                    <td>{"📄"} {item.name}</td>
                    <td>{item.type}</td>
                    <td>{item.date}</td>
                    <td>{item.owner}</td>
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
          <div className="retrieve-button-container">
            {showInput && (
              <input 
                type="text"
                value={text}
                id="transaction-id-input"
                onChange={(e) =>  {
                  setText((e.target.value).replace(/[^a-zA-Z0-9]/g, ''));
                  // Using a regular expression here that makes sure only letters or numbers are inputted into the text box
                }} 
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && text !== '') {
                    handleFileRetrieval(text);
                    setText('');
                    setShowInput(false);
                  }
                }}
                placeholder="Transaction ID Here (Enter to Submit)" 
              />
            )}
            <button className="retrieve-button" onClick={() => setShowInput(!showInput)}>+ Retrieve File</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
