import _ from 'lodash';
import PropTypes from 'prop-types';

const Ability = ({ userRole, accessibleRoles, children }) => {
  if (_.isString(accessibleRoles)) {
    accessibleRoles = accessibleRoles.split(',').map((x) => x.trim());
  }
  if (_.includes(accessibleRoles, userRole)) {
    return children;
  }
  return null;
};

Ability.propTypes = {
  userRole: PropTypes.string.isRequired,
  accessibleRoles: PropTypes.any.isRequired,
};

export default Ability;
