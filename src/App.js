import React, { useState } from "react";
import "./App.css";
import { createPow, ffsTypes } from "@textile/powergate-client";
const host = "http://0.0.0.0:6002"; // or whatever powergate instance you want

const pow = createPow({ host });

function App() {
  const [output, setOutput] = useState("");
  const [authToken, setAuthToken] = useState("");
  const [cid, setCID] = useState("");
  const [jobId, setJobId] = useState("");
  const [newAddr, setAddress] = useState('')

  const checkHealth = async () => {
    const { status } = await pow.health.check();
    setOutput(JSON.stringify({ status }));
  };

  const generateToken = async () => {
    const { token } = await pow.ffs.create();
    setAuthToken(token);
    console.log(authToken)
    pow.setToken(token);
    setOutput(token);
  };

  const getAddressList = async () => {
    // get wallet addresses associated with your FFS instance
    const { addrsList } = await pow.ffs.addrs();
    console.log("ADDRESS LIST");
    console.log(addrsList);
    setOutput(JSON.stringify(addrsList));
  };

  const createAddress = async () => {
    // create a new address associated with your ffs instance
    const { addr } = await pow.ffs.newAddr("my new addr");
    console.log("NEW ADDRESS");
    console.log(addr);
    setOutput(addr);
    setAddress(addr);
  };

  const getInfo = async () => {
    // get general info about your ffs instance
    const { info } = await pow.ffs.info();
    console.log("INFO");
    console.log(info);
    setOutput(JSON.stringify(info));
  };

  const cacheDataIPFS = async () => {
    try {
      const input = document.getElementById("file-upload");

      let file = input.files[0];

      let reader = new FileReader();

      const buffer = reader.readAsArrayBuffer(file);

      reader.onload = async () => {
        console.log(reader.result);
        //  cache data in IPFS in preparation to store it using FFS
        const { cid } = await pow.ffs.addToHot(buffer);
        console.log(cid);
        setOutput(cid);
        setCID(cid);
      };

      reader.onerror = () => {
        console.log(reader.error);
        setOutput("No file found");
      };
    } catch (error) {
      setOutput("No file found");
    }
  };

  const storeDataInFFS = async () => {
    // store the data in FFS using the default storage configuration
    const { jobId } = await pow.ffs.pushConfig(cid);
    setJobId(jobId);
    setOutput(jobId);
  };

  const watchFFSStatus = async () => {
    //  watch the FFS job status to see the storage process progressing
    pow.ffs.watchJobs((job) => {
      console.log(ffsTypes.JobStatus[job.status])
      if (job.status === ffsTypes.JobStatus.CANCELED) {
        console.log("job canceled")
      } else if (job.status === ffsTypes.JobStatus.FAILED) {
        console.log("job failed")
      } else if (job.status === ffsTypes.JobStatus.SUCCESS) {
        console.log("job success!")
      }
    }, jobId)
  };

  const watchFFSEventsForCID = async () => {
    // watch all FFS events for a cid
    pow.ffs.watchLogs((logEvent) => {
      console.log(`received event for cid ${logEvent.cid}`);
    }, cid);
  };

  // const getDesiredStorageConfigForCid = async (cid) => {
  //   // get the current desired storage configuration for a cid (this configuration may not be realized yet)
  //   const { config } = await pow.ffs.getCidConfig(cid);
  // };

  // const getActualStorageConfigForCid = async (cid) => {
  //   // get the current actual storage configuration for a cid
  //   const { cidinfo } = await pow.ffs.show(cid);
  // };

  const getDataFromFFS = async () => {
    // retreive data from FFS by cid
    const bytes = await pow.ffs.get(cid);
    console.log(bytes)
  };

  const sendFIL = async () => {
    if(!newAddr) {
      setOutput('Generate a second address first')
    }
    const { addrsList } = await pow.ffs.addrs();
    const fromAddress = addrsList[0].addr;
    const toAddress = newAddr;
    // senf FIL from an address managed by your FFS instance to any other address
    const tx = await pow.ffs.sendFil(fromAddress, toAddress, 1000);
    console.log(tx)
  };

  return (
    <div className="App">
      <div>
        <button onClick={checkHealth}>Health Check</button>
      </div>
      <div>
        <button onClick={generateToken}>Get Token</button>
      </div>
      <div>
        <button onClick={getAddressList}>Get Address List</button>
      </div>
      <div>
        <button onClick={createAddress}>Create New Address</button>
      </div>
      <div>
        <div>
          <input type="file" id="file-upload" />
        </div>
        <div>
          <button onClick={cacheDataIPFS}>Cache Data to IPFS</button>
        </div>
      </div>
      <div>
        <button onClick={storeDataInFFS}>Store Data in FFS</button>
      </div>
      <div>
        <button onClick={watchFFSStatus}>Watch FFS Status</button>
      </div>
      <div>
        <button onClick={getDataFromFFS}>Get Data From FFS</button>
      </div>
      <div>
        <button onClick={watchFFSEventsForCID}>Watch Events for CID</button>
      </div>
      <div>
        <button onClick={getInfo}>Get FFS Info</button>
      </div>
      <div>
        <button onClick={sendFIL}>Send FIL</button>
      </div>
      <div>
        <h3>Output: </h3>
        <p>{output}</p>
      </div>
    </div>
  );
}

export default App;
