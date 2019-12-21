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

  static saveSidebarWidth = (width) => {
    try {
      localStorage.setItem('sidebarWidth', width);
    } catch (err) {
      console.log(err);
    }
  }

  static loadSidebarWidth = () => {
    try {
      const width = localStorage.getItem('sidebarWidth');
      return width;
    } catch (err) {
      return undefined;
    }
  }
}
