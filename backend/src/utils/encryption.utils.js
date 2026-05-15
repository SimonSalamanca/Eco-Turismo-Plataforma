const CryptoJS = require('crypto-js');
const env = require('../config/env');

const getSecretKey = () => {
  const key = env.encryption?.aesSecretKey;
  if (!key) {
    throw new Error('AES_SECRET_KEY no configurada en variables de entorno');
  }
  return key;
};

const encrypt = (data) => {
  if (!data) {
    throw new Error('Data es requerida para encriptar');
  }

  const secretKey = getSecretKey();

  if (typeof data === 'object') {
    const encrypted = CryptoJS.AES.encrypt(
      JSON.stringify(data),
      secretKey
    ).toString();
    return encrypted;
  }

  const encrypted = CryptoJS.AES.encrypt(data.toString(), secretKey).toString();
  return encrypted;
};

const decrypt = (encryptedData) => {
  if (!encryptedData) {
    throw new Error('EncryptedData es requerido para desencriptar');
  }

  const secretKey = getSecretKey();

  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, secretKey);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);

    try {
      return JSON.parse(decrypted);
    } catch {
      return decrypted;
    }
  } catch (error) {
    throw new Error('Error al desencriptar datos: ' + error.message);
  }
};

const encryptBankInfo = (bankInfo) => {
  const requiredFields = ['accountNumber', 'accountType', 'bankName'];
  for (const field of requiredFields) {
    if (!bankInfo[field]) {
      throw new Error(`Campo requerido faltante: ${field}`);
    }
  }

  const sensitiveData = {
    accountNumber: bankInfo.accountNumber.slice(-4).padStart(bankInfo.accountNumber.length, '*'),
    accountType: bankInfo.accountType,
    bankName: bankInfo.bankName
  };

  return encrypt(bankInfo);
};

const encryptWithCustomKey = (data, customKey) => {
  if (!customKey || customKey.length < 32) {
    throw new Error('Clave personalizada debe tener al menos 32 caracteres');
  }

  if (typeof data === 'object') {
    return CryptoJS.AES.encrypt(JSON.stringify(data), customKey).toString();
  }

  return CryptoJS.AES.encrypt(data.toString(), customKey).toString();
};

const decryptWithCustomKey = (encryptedData, customKey) => {
  if (!customKey || customKey.length < 32) {
    throw new Error('Clave personalizada debe tener al menos 32 caracteres');
  }

  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, customKey);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);

    try {
      return JSON.parse(decrypted);
    } catch {
      return decrypted;
    }
  } catch (error) {
    throw new Error('Error al desencriptar con clave personalizada: ' + error.message);
  }
};

const hashData = (data) => {
  return CryptoJS.SHA256(data).toString();
};

const generateSecureToken = (length = 32) => {
  return CryptoJS.lib.WordArray.random(length).toString();
};

module.exports = {
  encrypt,
  decrypt,
  encryptBankInfo,
  encryptWithCustomKey,
  decryptWithCustomKey,
  hashData,
  generateSecureToken
};