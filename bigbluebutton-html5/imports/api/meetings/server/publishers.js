import { Meteor } from 'meteor/meteor';
import Meetings, {
  RecordMeetings,
  MeetingTimeRemaining,
  ExternalVideoMeetings,
} from '/imports/api/meetings';
import Users from '/imports/api/users';
import Logger from '/imports/startup/server/logger';
import { publicationSafeGuard } from '/imports/api/common/server/helpers';
import AuthTokenValidation, { ValidationStates } from '/imports/api/auth-token-validation';

const ROLE_MODERATOR = Meteor.settings.public.user.role_moderator;

function meetings() {
  const tokenValidation = AuthTokenValidation.findOne({ connectionId: this.connection.id });

  if (!tokenValidation || tokenValidation.validationStatus !== ValidationStates.VALIDATED) {
    Logger.warn(`Publishing Meetings was requested by unauth connection ${this.connection.id}`);
    return Meetings.find({ meetingId: '' });
  }

  const { meetingId, userId } = tokenValidation;

  Logger.debug('Publishing meeting', { meetingId, userId });

  const selector = {
    $or: [
      { meetingId },
    ],
  };

  const User = Users.findOne({ userId, meetingId }, { fields: { userId: 1, role: 1 } });
  if (!!User && User.role === ROLE_MODERATOR) {
    selector.$or.push({
      'meetingProp.isBreakout': true,
      'breakoutProps.parentId': meetingId,
    });
    // Monitor this publication and stop it when user is not a moderator anymore
    const comparisonFunc = () => {
      const user = Users.findOne({ userId, meetingId }, { fields: { role: 1, userId: 1 } });
      const condition = user.role === ROLE_MODERATOR;

      if (!condition) {
        Logger.info(`conditions aren't filled anymore in publication ${this._name}: 
        user.role === ROLE_MODERATOR :${condition}, user.role: ${user.role} ROLE_MODERATOR: ${ROLE_MODERATOR}`);
      }

      return condition;
    };
    publicationSafeGuard(comparisonFunc, this);
  }
  const options = {
    fields: {
      password: false,
      'welcomeProp.modOnlyMessage': false,
    },
  };

  if (User.role === ROLE_MODERATOR) {
    delete options.fields.password;
    options.fields['password.viewerPass'] = false;
    options.fields['password.moderatorPass'] = false;
  }

  return Meetings.find(selector, options);
}

function publish(...args) {
  const boundMeetings = meetings.bind(this);
  return boundMeetings(...args);
}

Meteor.publish('meetings', publish);

function recordMeetings() {
  const tokenValidation = AuthTokenValidation.findOne({ connectionId: this.connection.id });

  if (!tokenValidation || tokenValidation.validationStatus !== ValidationStates.VALIDATED) {
    Logger.warn(`Publishing RecordMeetings was requested by unauth connection ${this.connection.id}`);
    return RecordMeetings.find({ meetingId: '' });
  }

  const { meetingId, userId } = tokenValidation;

  Logger.debug(`Publishing RecordMeetings for ${meetingId} ${userId}`);

  return RecordMeetings.find({ meetingId });
}
function recordPublish(...args) {
  const boundRecordMeetings = recordMeetings.bind(this);
  return boundRecordMeetings(...args);
}

Meteor.publish('record-meetings', recordPublish);

function externalVideoMeetings() {
  const tokenValidation = AuthTokenValidation.findOne({ connectionId: this.connection.id });

  if (!tokenValidation || tokenValidation.validationStatus !== ValidationStates.VALIDATED) {
    Logger.warn(`Publishing ExternalVideoMeetings was requested by unauth connection ${this.connection.id}`);
    return ExternalVideoMeetings.find({ meetingId: '' });
  }

  const { meetingId, userId } = tokenValidation;

  Logger.debug(`Publishing ExternalVideoMeetings for ${meetingId} ${userId}`);

  return ExternalVideoMeetings.find({ meetingId });
}

function externalVideoPublish(...args) {
  const boundExternalVideoMeetings = externalVideoMeetings.bind(this);
  return boundExternalVideoMeetings(...args);
}

Meteor.publish('external-video-meetings', externalVideoPublish);

function meetingTimeRemaining() {
  const tokenValidation = AuthTokenValidation.findOne({ connectionId: this.connection.id });

  if (!tokenValidation || tokenValidation.validationStatus !== ValidationStates.VALIDATED) {
    Logger.warn(`Publishing MeetingTimeRemaining was requested by unauth connection ${this.connection.id}`);
    return MeetingTimeRemaining.find({ meetingId: '' });
  }

  const { meetingId, userId } = tokenValidation;
  Logger.debug(`Publishing MeetingTimeRemaining for ${meetingId} ${userId}`);

  return MeetingTimeRemaining.find({ meetingId });
}
function timeRemainingPublish(...args) {
  const boundtimeRemaining = meetingTimeRemaining.bind(this);
  return boundtimeRemaining(...args);
}

Meteor.publish('meeting-time-remaining', timeRemainingPublish);
