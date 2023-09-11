#!/usr/bin/env node

const ethers = require('ethers');
const bip39 = require('bip39');
const fs = require('fs').promises;
const readlineSync = require('readline-sync');

const args = process.argv.slice(2);
const showMnemonic = args.includes('--show-mnemonic');
const customLastWord = args.includes('--custom-last-word');
const decryptWallet = args.includes('--decrypt-wallet');

async function getPassword(promptMessage = 'Please enter a strong password to encrypt your wallet: ') {
    let password = readlineSync.question(promptMessage, {
        hideEchoBack: true
    });
    return password;
}

async function getLastWord(mnemonicWords) {
    let lastWordVerified = false;
    let lastWord;

    while (!lastWordVerified) {
        lastWord = readlineSync.question('Please enter your custom last word for the mnemonic: ', {
            hideEchoBack: true
        });
        const verifyLastWord = readlineSync.question('Please re-enter your custom last word for verification: ', {
            hideEchoBack: true
        });
        if (lastWord === verifyLastWord) {
            lastWordVerified = true;
        } else {
            console.log("The last words do not match. Please try again.");
        }
    }

    return lastWord;
}

async function decryptAndShowWallet() {
    const file = readlineSync.question('Please enter the encrypted wallet file name or hit Enter to use "wallet.json": ', {
        defaultInput: 'wallet.json'
    });

    const encryptedJson = await fs.readFile(file, 'utf8');
    const password = await getPassword('Please enter the password to decrypt your wallet: ');
    const wallet = await ethers.Wallet.fromEncryptedJson(encryptedJson, password);
    console.log('Wallet decrypted successfully');
    console.log(`Address: ${wallet.address}`);
    console.log(`Private Key: ${wallet.privateKey}`);
}

async function main() {
    if (decryptWallet) {
        await decryptAndShowWallet();
        return;
    }

    const mnemonic = bip39.generateMnemonic();
    const mnemonicWords = mnemonic.split(' ');

    if (showMnemonic) {
        console.log("Full Mnemonic:", mnemonic);
    }

    if (!showMnemonic) {
        const partialMnemonic = mnemonicWords.slice(0, -1).join(' ');
        console.log("Partial Mnemonic:", partialMnemonic);
    }

    let lastWord;

    if (customLastWord) {
        lastWord = await getLastWord(mnemonicWords);
    } else {
        lastWord = mnemonicWords[mnemonicWords.length - 1];
    }

    const password = await getPassword();

    const fullMnemonic = `${mnemonicWords.slice(0, -1).join(' ')} ${lastWord}`;

    if (!bip39.validateMnemonic(fullMnemonic)) {
        console.error('Invalid mnemonic');
        return;
    }

    const wallet = ethers.Wallet.fromPhrase(fullMnemonic);
    console.log("Address:", wallet.address);

    const encryptedWallet = await wallet.encrypt(password);
    
    let fileName = 'wallet.json';
    try {
        await fs.access(fileName);
        const overwrite = readlineSync.question('wallet.json already exists. Do you want to overwrite it? (y/n): ');
        if (overwrite.toLowerCase() !== 'y') {
            fileName = readlineSync.question('Enter a different name for the wallet file: ');
        }
    } catch (error) {
        // File doesn't exist, continue as planned
    }

    await fs.writeFile(fileName, encryptedWallet);
    console.log(`Encrypted wallet saved to ${fileName}`);
}

main().catch(console.error);
