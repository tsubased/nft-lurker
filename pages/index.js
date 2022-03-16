import Head from 'next/head';
import { ethers } from 'ethers';
import { useState, useEffect, useRef } from 'react';
import abi from './abi.json';
1;
export default function Home() {
  const ipfsIOSitePrefix = 'https://ipfs.io/ipfs/';
  const provider = new ethers.providers.getDefaultProvider();
  // default contract is whatever i decide to test with lol
  const contractAddrInput = useRef();
  const [contractAddr, setContractAddr] = useState(
    '0x364C828eE171616a39897688A831c2499aD972ec'
  );
  const contract = new ethers.Contract(contractAddr, abi, provider);
  const [txs, setTxs] = useState([]);
  const [errorMsg, setErrorMsg] = useState();
  const [blockNum, setBlockNum] = useState();
  const filterNone = contract.filters.Transfer(null, null, null); // to get old events
  let currentBlockNum;
  const [count, setCount] = useState(0);

  const handleTransfer = async (from, to, id) => {
    let type;

    if (from === ethers.constants.AddressZero) {
      type = 'mint';
    } else {
      type = 'transfer';
    }
    let tokenURI = await contract.tokenURI(id);
    const ipfsStartURI = 'ipfs://';
    if (tokenURI.startsWith(ipfsStartURI)) {
      tokenURI = `${ipfsIOSitePrefix}${tokenURI.substring(
        ipfsStartURI.length
      )}`;
    }
    // console.log('tokenURI is ' + tokenURI);
    let tokenMetadataJSON = await fetch(tokenURI).then((response) =>
      response.json()
    );
    let imageURL = tokenMetadataJSON['image'];
    if (imageURL.startsWith(ipfsStartURI)) {
      imageURL = `${ipfsIOSitePrefix}${imageURL.substring(
        ipfsStartURI.length
      )}`;
    }
    let name = tokenMetadataJSON['name'];
    setTxs((prev) => [
      {
        type,
        from,
        to,
        id: id.toString(),
        name,
        imageURL,
        tokenURI,
      },
      ...prev,
    ]);
  };

  const handleAddrClick = (addrStr) => {
    if (ethers.utils.isAddress(addrStr)) {
      setContractAddr(addrStr);
      setErrorMsg();
    } else {
      setErrorMsg('Contract address is invalid!');
    }
  };

  // Run only when contractAddr set
  useEffect(() => {
    currentBlockNum = async () => provider.getBlockNumber();
    setBlockNum(1);
    const getBlockNumber = async () => {
      currentBlockNum = await provider.getBlockNumber();
      setBlockNum(currentBlockNum);
    };
    getBlockNumber();
    console.log(currentBlockNum);
    const fetchHistoricalTransfers = async () => {
      // const events = await contract.queryFilter(
      //   filterNone,
      //   14380000 - 3000,
      //   "last"
      // );
      const events = await contract.queryFilter(
        filterNone,
        -3000 // latest 3000 blocks
      );
      events.forEach((event) => {
        // args are from, to, id
        handleTransfer(event.args[0], event.args[1], event.args[2]);
        //console.log(event);
      });
    };
    fetchHistoricalTransfers();
    contract.on('Transfer', handleTransfer);
    return () => {
      // cleanup function
      contract.removeAllListeners('Transfer');
      setTxs([]);
    };
  }, [contractAddr]);

  return (
    <div data-theme="synthwave">
      <Head>
        <title>NFT headshot sniper</title>
      </Head>
      <div className="hero min-h-[40%] bg-base-300">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <h1 className="prose prose-headings text-5xl font-bold">
              NFT Tracker
            </h1>
            <p className="prose py-6">Monitor movement of NFTs in realtime</p>
            <button className="btn btn-secondary">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                className="fill-current"
              >
                <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"></path>
              </svg>
              <a
                className="px-2 lowercase"
                href="https://twitter.com/tsubased/"
                target="_blank"
              >
                @tsubased
              </a>
            </button>
          </div>
        </div>
      </div>

      <div className="md:flex md:justify-center bg-base-100">
        <div className="flex flex-col mx-8">
          {errorMsg && (
            <div class="my-4 alert alert-error shadow-lg">
              <div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="stroke-current flex-shrink-0 h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>{errorMsg}</span>
              </div>
            </div>
          )}
          <div className="my-4 form-control w-full max-w-xs">
            <label className="label">
              <span className="label-text">Contract Address</span>
            </label>
            <div className="input-group">
              <input
                type="text"
                placeholder="0xAddress..."
                className="input input-bordered input-secondary w-full max-w-xs"
                ref={contractAddrInput}
              ></input>
              <button
                class="btn btn-square"
                onClick={() => handleAddrClick(contractAddrInput.current.value)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>
            </div>
          </div>
          {txs &&
            txs.map((tx, index) => (
              <div
                key={index}
                className="card my-4 md:card-side bg-base-200 shadow-md md:max-w-2xl"
                // className="card my-4 lg:card-side bg-primary-content shadow-xl md:max-w-2xl"
              >
                <figure className="relative">
                  <img
                    className="min-h-full"
                    src={tx.imageURL}
                    alt={`image of ${tx.name}`}
                  ></img>
                  <figcaption className="absolute top-0 left-0 p-2">
                    <div class="badge badge-accent">NEW</div>
                  </figcaption>
                </figure>
                <div className="card-body">
                  <div className="prose prose-headings">
                    <h2 className="card-title">
                      {tx.name}
                      <div class="badge badge-secondary">{tx.type}</div>
                    </h2>
                  </div>
                  <p className="prose break-normal hover:break-words">
                    From: {tx.from}
                  </p>
                  <p className="prose break-normal hover:break-words">
                    To: {tx.to}
                  </p>
                  <div className="card-actions justify-end">
                    <a
                      href={`https://opensea.io/assets/${contractAddr}/${tx.id}`}
                      target="_blank"
                    >
                      <button className="btn btn-primary">View Opensea</button>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          <button className="btn">{blockNum}</button>
          <p>Current Block {blockNum}</p>
          <p>Current count {count}</p>
          {/* //<p>Items count {historicalItems.length}</p> */}
          <button onClick={() => setCount(count + 1)}>Click me</button>
        </div>
      </div>
    </div>
  );
}
