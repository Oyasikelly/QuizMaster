import CryptoJS from "crypto-js";

// Key used for encryption and decryption (use environment variables for production)
const SECRET_KEY = process.env.NEXT_PUBLIC_SECRET_KEY;

/**
 * Encrypts and stores data in localStorage.
 * @param {string} key - The key to store the data under.
 * @param {Object} value - The data to store.
 */
export const setSecureItem = (key, value) => {
  try {
    const encryptedData = CryptoJS.AES.encrypt(
      JSON.stringify(value),
      SECRET_KEY
    ).toString();
    localStorage.setItem(key, encryptedData);
  } catch (err) {
    console.error("Error encrypting data:", err);
  }
};

/**
 * Retrieves and decrypts data from localStorage.
 * @param {string} key - The key of the stored data.
 * @returns {Object|null} - The decrypted data or null if it fails.
 */
export const getSecureItem = (key) => {
  try {
    const encryptedData = localStorage.getItem(key);
    if (!encryptedData) return null;

    const decryptedBytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
    const decryptedData = JSON.parse(
      decryptedBytes.toString(CryptoJS.enc.Utf8)
    );
    return decryptedData;
  } catch (err) {
    console.error("Error decrypting data:", err);
    return null;
  }
};

/**
 * Removes the stored item from localStorage.
 * @param {string} key - The key of the stored data.
 */
export const removeSecureItem = (key) => {
  localStorage.removeItem(key);
};
