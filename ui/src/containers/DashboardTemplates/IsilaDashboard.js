import { connect } from 'react-redux';
import { withProps, compose, withHandlers } from 'recompose';
import { loggedInUserId } from 'ui/redux/modules/auth';
import { activeOrgIdSelector } from 'ui/redux/modules/router';
import { CREATE_ISILA_DASHBOARD } from 'ui/redux/modules/dashboard/isilaDashboard';
import iconImage from './assets/stream-starter.png';
import TemplateCard from './TemplateCard';

const enhance = compose(
  withProps({
    title: 'ISILA Starter',
    image: iconImage,
  }),
  connect(
    state => ({
      userId: loggedInUserId(state),
      organisationId: activeOrgIdSelector(state)
    }),
    dispatch => ({
      createIsilaDashboard: ({ userId, organisationId }) => dispatch({
        dispatch,
        type: CREATE_ISILA_DASHBOARD,
        userId,
        organisationId,
      })
    })
  ),
  withHandlers({
    onSelect: ({ userId, organisationId, createIsilaDashboard }) => () => {
      createIsilaDashboard({ userId, organisationId });
    }
  }),
);

const IsilaDashboard = enhance(TemplateCard);

export default IsilaDashboard;
