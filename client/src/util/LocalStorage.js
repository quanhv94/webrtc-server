export default class LocalStorage {
  static saveUserConfig = (userId, config) => {
    try {
      localStorage.setItem(`config_${userId}`, JSON.stringify(config));
    } catch (err) {
      console.log(err);
    }
  }

  static loadUserConfig = (userId) => {
    try {
      const config = localStorage.getItem(`config_${userId}`);
      if (!config) return undefined;
      return JSON.parse(config);
    } catch (err) {
      return undefined;
    }
  }
}
