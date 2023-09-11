const ethers = require('ethers');
const bip39 = require('bip39');
const fs = require('fs').promises;
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const args = process.argv.slice(2);
const showMnemonic = args.includes('--show-mnemonic');
const customLastWord = args.includes('--custom-last-word');

async function main() {
    const mnemonic = bip39.generateMnemonic();
    const mnemonicWords = mnemonic.split(' ');

    if (showMnemonic) {
        console.log("Full Mnemonic:", mnemonic);
    }

    if (!showMnemonic) {
        const partialMnemonic = mnemonicWords.slice(0, -1).join(' ');
        console.log("Partial Mnemonic:", partialMnemonic);
    }

    if (customLastWord) {
        rl.question('Please enter your custom last word for the mnemonic: ', function(lastWord) {
            proceedWithLastWord(lastWord);
        });
    } else {
        proceedWithLastWord(mnemonicWords[mnemonicWords.length - 1]);
    }
}

function proceedWithLastWord(lastWord) {
    rl.question('Please enter a strong password to encrypt your wallet: ', async function(password) {
        rl.close();

        const fullMnemonic = `${mnemonicWords.slice(0, -1).join(' ')} ${lastWord}`;

        if (!bip39.validateMnemonic(fullMnemonic)) {
            console.error('Invalid mnemonic');
            return;
        }

        const wallet = ethers.Wallet.fromMnemonic(fullMnemonic);
        console.log("Address:", wallet.address);

        const encryptedWallet = await wallet.encrypt(password);
        await fs.writeFile('wallet.json', encryptedWallet);
        console.log('Encrypted wallet saved to wallet.json');
    });
}

main().catch(console.error);
