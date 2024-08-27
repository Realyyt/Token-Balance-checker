import express from 'express';
import { ethers } from 'ethers';
import path from 'path';
import cors from 'cors';

const MOXIE_CONTRACT_ADDRESS = '0x01c6a9c7c64cC9dFF94B11e54bd8E35c055F4563'; // Moxie token contract address
const MOXIE_ABI = ['function balanceOf(address) view returns (uint256)']; // Minimal ABI for balance checking


const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());

app.use(express.static(path.join(__dirname, '../public')));

app.get('/', (req, res) => {
  res.send('Moxie Balance Checker');
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});


app.get('/balance/:address', async (req, res) => {
  try {
    const address = req.params.address;
    if (!ethers.isAddress(address)) {
      return res.status(400).json({ error: 'Invalid Ethereum address' });
    }
    const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
    const contract = new ethers.Contract(MOXIE_CONTRACT_ADDRESS, MOXIE_ABI, provider);
    const balance = await contract.balanceOf(address);
    res.json({ address, balance: ethers.formatUnits(balance, 18) });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error fetching balance: ' + error.message });
  }
});

app.get('/historical-balance/:address', async (req, res) => {
  try {
    const address = req.params.address;
    if (!ethers.isAddress(address)) {
      return res.status(400).json({ error: 'Invalid Ethereum address' });
    }
    
    const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
    const contract = new ethers.Contract(MOXIE_CONTRACT_ADDRESS, MOXIE_ABI, provider);
    
    // Get current block number
    const currentBlock = await provider.getBlockNumber();
    
    // Fetch balances at different block heights (e.g., current, 1 day ago, 1 week ago)
    const balances = await Promise.all([
      contract.balanceOf(address, { blockTag: currentBlock }),
      contract.balanceOf(address, { blockTag: currentBlock - 6500 }), // ~1 day ago
      contract.balanceOf(address, { blockTag: currentBlock - 45500 }) // ~1 week ago
    ]);
    
    res.json({
      address,
      currentBalance: ethers.formatUnits(balances[0], 18),
      oneDayAgoBalance: ethers.formatUnits(balances[1], 18),
      oneWeekAgoBalance: ethers.formatUnits(balances[2], 18)
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error fetching historical balance: ' + error.message });
  }
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});
