import axios from 'axios';
import React, { ChangeEvent, useState } from 'react';
import './App.css';
import { ResilientDB } from 'resilientdb-javascript-sdk';


// Generate public and private keys
const { publicKey: currentPublicKey, privateKey } = ResilientDB.generateKeys();


console.log(`Public Key: ${currentPublicKey}`);
console.log(`Private Key: ${privateKey}`);

interface Item {
  name: string;
  typeBroad: string;
  type: string;
  date: string;
  owner: string;
  transacID: string;
  publicKey: string;
  isRetrieved: boolean;
  transacPrivateKey: string | null;
  fileData: Blob;
  //True means retrieved, false means uploaded
}

//Common filetype extensions and their conversion to MIME
const extensionToMimeType: Record<string, string> = {
  "js": "application/javascript",
  "json": "application/json",
  "pdf": "application/pdf",
  "doc": "application/msword",
  "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "xls": "application/vnd.ms-excel",
  "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "zip": "application/zip",
  "png": "image/png",
  "jpg": "image/jpeg",
  "jpeg": "image/jpeg",
  "gif": "image/gif",
  "webp": "image/webp",
  "mp3": "audio/mpeg",
  "mp4": "video/mp4",
  "avi": "video/x-msvideo",
  "txt": "text/plain",
  "html": "text/html",
  "css": "text/css",
};


const App: React.FC = () => {
  const [ownerName, setOwnerName] = useState("Unnamed Owner");
  const [items, setItems] = useState<Item[]>([

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
    formData.append('owner_public_key', currentPublicKey);
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


      alert('File Uploaded Successfully.');
      console.log(`File Upload Response: ${JSON.stringify(response.data)}`);

      
      const lastModifiedDate = new Date(uploadedFile.lastModified);


      const responseMsg = response.data.message
      // We'll parse out the transaction ID from the API response message
      const noEdgeSpaces = responseMsg.trim();

      const messageWords = noEdgeSpaces.split(' ');

      const transactionID = messageWords.pop(); 

      console.log(transactionID);
    

        


      const newElement:Item = { name: uploadedFile.name, typeBroad: uploadedFile.type.split('/')[0], type: uploadedFile.type.split('/')[1], date: lastModifiedDate.toString(), owner: ownerName, transacID: transactionID, publicKey: currentPublicKey,  isRetrieved: false, transacPrivateKey: privateKey, fileData: new Blob()}

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
  
    // Do not execute retrieval if an empty string is inputted
    if (!givenTransactionID) return;

    // Do not execute retrieval if an identical retrieval with the same transaction ID was done before in this session/save
    // Also, store for later whether there is an identical uploaded file from this session or save and replace that with a retrieval version to allow downloads
    let uploadedVersionIndex = -1;
    for (let i = 0; i < items.length; i++) {
      if (items[i].transacID === givenTransactionID) {
        if(items[i].isRetrieved === true){
          alert('This File Has Already Been Retrieved to Your Drive, Please Enter a Different Transaction ID');
          return;
        }else{
          uploadedVersionIndex = i;
          break;
        }
      }
    }
  
  
    try {
      console.log('Attempting to retrieve file with Transaction ID:', givenTransactionID);

      const response = await axios.post(
        `https://resilientfilesapi.onrender.com/retrieve_file/?tx_id=${givenTransactionID}`, {
      responseType: 'blob'});


      if(uploadedVersionIndex === -1){
        alert('New File Retrieved Successfully.');
      }else{
        alert('Previously Uploaded File Retrieved Successfully.');
      }

      console.log(`File retrieved successfully: ${JSON.stringify(response.data)}`);
      


      if(uploadedVersionIndex === -1){
        const transac = await axios.get(`https://crow.resilientdb.com/v1/transactions/${givenTransactionID}`);


        const retrievedMetadata = transac.data.asset;

        const transacPublicKey = retrievedMetadata.data.file_info.owner_key;

      
        const fileName = retrievedMetadata.data.file_info.file_name;

        const ownerName = retrievedMetadata.data.file_info.owner_name;

        const fileType = retrievedMetadata.data.file_info.file_type;

        const lastMod = retrievedMetadata.data.file_info.modification_time;

        const fileTypeFull = (extensionToMimeType[fileType]) ? extensionToMimeType[fileType] : `file/${fileType}`;

        const blobFileData = new Blob([response.data], { type: fileTypeFull });

        
        const newElement:Item = { name: fileName, typeBroad: fileTypeFull.split('/')[0], type: fileTypeFull.split('/')[1], date: lastMod, owner: ownerName, transacID: givenTransactionID, publicKey: transacPublicKey, isRetrieved: true, transacPrivateKey: null, fileData: blobFileData }

        setItems([...items, newElement]);

      }else{

        const blobFileData = new Blob([response.data], { type: (items[uploadedVersionIndex].typeBroad + "/" + items[uploadedVersionIndex].type) });

        items[uploadedVersionIndex].fileData = blobFileData;
        items[uploadedVersionIndex].isRetrieved = true;
        //Refresh the HTML of the page by calling setItems but not changing the items array
        setItems([...items]);
      }

    } catch (error: any) {
      console.error('Error retrieving file:', error);
      if (error.response) {
        alert('Error retrieving file. Please Enter a Valid Transaction ID.');
      } else {
        alert(`Error: ${error.message}`);
      }
    }
  };

  const downloadFile = async (blob: Blob, fileName: string) => {
    try {
      

      const url = URL.createObjectURL(blob);
  
      const temp = document.createElement("a");
      temp.href = url;
      temp.download = fileName;
  
      document.body.appendChild(temp);

      temp.click();
  
      document.body.removeChild(temp);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error("Failed to download the file:", error);
      alert('Failed to Download the File.')
    }
  };

  
  const downloadSaveFile = () => {
    try {
      const currentTime = (new Date()).toString();
      const wrapper = {
        currentTime,
        ownerName, 
        items: items.map((item) => ({
          ...item,
          isRetrieved: false,
          transacPrivateKey: item.transacPrivateKey,
          fileData: null, 
        })),
      };

      const jsonString = JSON.stringify(wrapper, null, 2);

      const blob = new Blob([jsonString], { type: 'text/plain' });

      const url = URL.createObjectURL(blob);
  
      const temp = document.createElement("a");
      temp.href = url;
      
      const tempDate = new Date();
      temp.download = "DriveSave" + tempDate.toDateString().replace(/\s/g, "") + ".txt";
  
      document.body.appendChild(temp);

      temp.click();
  
      document.body.removeChild(temp);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download the save file:", error);
      alert('Failed to Download the Save File.')
    }
  };

  const loadSaveFile = (e: ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
  
    if (!uploadedFile || uploadedFile.type !== "text/plain"){
      alert('Please Upload a Valid Save File That Was Previously Generated Here.');
      return;
    }

    let tempArr:Item[] = [];

    let tempName = "Unnamed Owner";


    try {
      let jsonObject;

      const reader = new FileReader();

      reader.onload = (e) => {
          
        const jsonString = e.target?.result as string;
        const parsedJson = JSON.parse(jsonString);
        jsonObject = parsedJson;

        if (!jsonObject || typeof jsonObject !== 'object') {
          alert('Please Upload a Valid Save File That Was Previously Generated Here and Unmodified.');
        }

        if((new Date(uploadedFile.lastModified)).toString() !== jsonObject['currentTime']){
          alert("Please Enter An Unmodified Save File.");
          return;
        }
  
        tempName = jsonObject['ownerName'];
  
        tempArr = jsonObject['items'];
  
        console.log(jsonObject['items']);
  
        for (let i = 0; i < tempArr.length; i++) {
          tempArr[i].fileData = new Blob();
        }
  
        setOwnerName(tempName);
  
        setItems(tempArr);

      };

      reader.readAsText(uploadedFile);



      

    } catch (error) {
      console.error("Failed to load the file:", error);
      alert('Failed to Load the Save File. Please Upload A Previously Generated Unmodified Save File.')
    }

  }

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
        (item) => item.type.endsWith(fileTypeFilter)
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
          <div className="export-save-button-container">
            <button className="export-button" onClick={() => downloadSaveFile()}>Export Save</button>
          </div>
          <div className="import-save-button-container">
            <input
              type="file"
              id="import-upload"
              onChange={loadSaveFile}
              hidden
            />
            <label htmlFor="import-upload" className="import-button">
              Import Save
            </label>
          </div>
          <div className="public-key-container">
            <label className="public-key-label">Current Public Key: {currentPublicKey}</label>
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
              <option value="recent">Recent</option>
            </select>
            <label htmlFor="fileType">File type:</label>
            <select
              id="fileType"
              value={fileTypeFilter}
              onChange={(e) => setFileTypeFilter(e.target.value)}
            >
              <option value="">All</option>
              <option value="pdf">.pdf</option>
              <option value="txt">.txt</option>
              <option value="rtf">.rtf</option>
              <option value="png">.png</option>
              <option value="jpg">.jpg</option>
              <option value="mp4">.mp4</option>
              <option value="mpeg">.mp3</option>
              <option value="pptx">.pptx</option>
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
                  <th>Transaction ID</th>
                  <th>Public Owner Key</th>
                  <th>Retrieved or Uploaded</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item, index) => (
                  <tr key={index}>
                    {(item.typeBroad === 'file' || item.typeBroad === 'application' || item.typeBroad === 'example' || item.typeBroad === 'haptics' || item.typeBroad === 'message' || item.typeBroad === 'multipart') &&
                      <td>📄 {item.name}</td>}
                    {(item.typeBroad === 'audio') &&
                      <td>🔊 {item.name}</td>}
                    {(item.typeBroad === 'image') &&
                      <td>📷 {item.name}</td>}
                    {(item.typeBroad === 'video') &&
                      <td>🎥 {item.name}</td>}
                    {(item.typeBroad === 'text') &&
                      <td>📝 {item.name}</td>}
                    {(item.typeBroad === 'font') &&
                      <td>🔡 {item.name}</td>}
                    <td>{item.type}</td>
                    <td>{item.date}</td>
                    <td>
                      {item.owner}
                      {item.transacPrivateKey &&
                      <label><br></br>(You Own This File)</label>}
                    </td>
                    <td>{item.transacID}</td>
                    <td>{item.publicKey}</td>
                    <td>
                      {item.isRetrieved ? "Retrieved" : "Uploaded" } 
                      {item.isRetrieved &&
                      <button className="download-button" onClick={() => downloadFile(item.fileData, item.name)}>Download</button>}
                    </td>
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
