const constants = {
  LocalStorageKey: {
    CLIENT_KEY: 'CLIENT_KEY',
    CLIENT_TOKEN: 'CLIENT_TOKEN',
    PARTNER_TOKEN: 'PARTNER_TOKEN',
    ADMIN_TOKEN: 'ADMIN_TOKEN',
  },
  apiHost: process.env.NODE_ENV === 'development'
    ? `${window.location.protocol}//${window.location.hostname}:3000`
    : `${window.location.protocol}//${window.location.host}`,
};

export default constants;

export const courseStatusOptions = [{
  value: 'draft',
  label: 'Bản nháp',
  icon: 'fa fa-pencil',
  color: '#414244',
}, {
  value: 'updating',
  label: 'Đang cập nhật',
  icon: 'fa fa-warning',
  color: '#ffc107',
}, {
  value: 'published',
  label: 'Đã phát hành',
  icon: 'fa fa-check',
  color: '#03a9f4',
}];

export const orderStatusOptions = [{
  value: 'pending',
  label: 'Đang thanh toán',
  color: '#ffc107',
}, {
  value: 'completed',
  label: 'Đã mua',
  color: '#4caf50',
}];

export const colors = ['#ff0000', '#00ff00', '#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722', '#795548', '#607d8b'];
