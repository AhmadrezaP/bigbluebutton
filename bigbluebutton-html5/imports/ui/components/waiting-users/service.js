import Meetings from '/imports/ui/local-collections/meetings-collection/meetings';
import Auth from '/imports/ui/services/auth';
import { makeCall } from '/imports/ui/services/api';

const guestUsersCall = (guestsArray, status) => makeCall('allowPendingUsers', guestsArray, status);

const changeGuestPolicy = (policyRule) => makeCall('changeGuestPolicy', policyRule);

const getGuestPolicy = () => {
  const meeting = Meetings.findOne(
    { meetingId: Auth.meetingID },
    { fields: { 'usersProp.guestPolicy': 1 } },
  );

  return meeting.usersProp.guestPolicy;
};

const isWaitingRoomEnabled = () => getGuestPolicy() === 'ASK_MODERATOR';

const isGuestLobbyMessageEnabled = Meteor.settings.public.app.enableGuestLobbyMessage;

// We use the dynamicGuestPolicy rule for allowing the rememberChoice checkbox
const allowRememberChoice = Meteor.settings.public.app.dynamicGuestPolicy;

const getGuestLobbyMessage = () => {
  const meeting = Meetings.findOne(
    { meetingId: Auth.meetingID },
    { fields: { guestLobbyMessage: 1 } },
  );

  if (meeting) return meeting.guestLobbyMessage;

  return '';
};

const setGuestLobbyMessage = (message) => makeCall('setGuestLobbyMessage', message);

export default {
  guestUsersCall,
  changeGuestPolicy,
  getGuestPolicy,
  isWaitingRoomEnabled,
  isGuestLobbyMessageEnabled,
  getGuestLobbyMessage,
  setGuestLobbyMessage,
  allowRememberChoice,
};
