import React, { Component } from 'react';
import PropTypes from 'prop-types';
import initializejQuery from '../../utils/initializejQuery';
import { renderLog } from '../../utils/logging';
import CandidateActions from '../../../actions/CandidateActions';
import BallotStore from '../../../stores/BallotStore';
import CandidateStore from '../../../stores/CandidateStore';
import VoterStore from '../../../stores/VoterStore';


class PoliticianPositionRetrieveController extends Component {
  constructor (props) {
    super(props);
    this.state = {
      atLeastOneCandidateFound: false,
      firstCandidatePositionsRetrieveInitiated: false,
      firstCandidateWeVoteId: '',
      positionListFromFriendsHasBeenRetrievedOnce: {},
      positionListHasBeenRetrievedOnce: {},
    };
  }

  componentDidMount () {
    // console.log('PoliticianPositionRetrieveController componentDidMount');
    this.onCandidateStoreChange();
    this.candidateStoreListener = CandidateStore.addListener(this.onCandidateStoreChange.bind(this));
    this.voterStoreListener = VoterStore.addListener(this.onVoterStoreChange.bind(this));
  }

  componentDidUpdate (prevProps) {
    const {
      politicianWeVoteId: politicianWeVoteIdPrevious,
    } = prevProps;
    const {
      politicianWeVoteId,
    } = this.props;
    // console.log('PoliticianPositionRetrieveController componentDidUpdate, politicianWeVoteIdPrevious:', politicianWeVoteIdPrevious, ', politicianWeVoteId:', politicianWeVoteId);
    if (politicianWeVoteId && politicianWeVoteIdPrevious) {
      if (politicianWeVoteId !== politicianWeVoteIdPrevious) {
        this.positionsFirstRetrieve();
      }
    }
  }

  componentWillUnmount () {
    this.candidateStoreListener.remove();
    this.voterStoreListener.remove();
  }

  onCandidateStoreChange () {
    const { politicianWeVoteId } = this.props;
    const candidateList = CandidateStore.getCandidateListByPoliticianWeVoteId(politicianWeVoteId);
    // console.log('PoliticianPositionRetrieveController onCandidateStoreChange, candidateList:', candidateList);
    if (candidateList && candidateList[0]) {
      this.setState({
        atLeastOneCandidateFound: true,
        firstCandidateWeVoteId: candidateList[0].we_vote_id,
      }, () => this.positionsFirstRetrieve());
    }
  }

  onVoterStoreChange () {
    this.onCandidateStoreChange();
  }

  positionsFirstRetrieve = () => {
    const { politicianWeVoteId } = this.props;
    // console.log('positionsFirstRetrieve politicianWeVoteId: ', politicianWeVoteId);
    if (politicianWeVoteId) {
      const { atLeastOneCandidateFound, firstCandidateWeVoteId, firstCandidatePositionsRetrieveInitiated } = this.state;
      initializejQuery(() => {
        const voterFirstRetrieveCompleted = VoterStore.voterFirstRetrieveCompleted();
        // console.log('PoliticianPositionRetrieveController firstCandidatePositionsRetrieveInitiated: ', firstCandidatePositionsRetrieveInitiated, ', atLeastOneCandidateFound: ', atLeastOneCandidateFound, ', firstCandidateWeVoteId: ', firstCandidateWeVoteId, ', voterFirstRetrieveCompleted: ', voterFirstRetrieveCompleted);
        if (voterFirstRetrieveCompleted && atLeastOneCandidateFound && firstCandidateWeVoteId && !firstCandidatePositionsRetrieveInitiated) {
          const alreadyRetrievedList = [];
          const candidateList = CandidateStore.getCandidateListByPoliticianWeVoteId(politicianWeVoteId);
          const howLongToDelayRetrieve = 2000;
          for (let i = 0; i < candidateList.length; i += 1) {
            // console.log('candidateList[i].we_vote_id: ', candidateList[i].we_vote_id);
            if (!alreadyRetrievedList.includes(candidateList[i].we_vote_id)) {
              // Leave a gap of 300 milliseconds between each request
              setTimeout(this.retrievePositionListsForOneCandidate(candidateList[i].we_vote_id), howLongToDelayRetrieve * i);
              alreadyRetrievedList.push(candidateList[i].we_vote_id);
            }
          }
          this.setState({
            firstCandidatePositionsRetrieveInitiated: true,
          });
        }
      });
    }
  }

  retrievePositionListsForOneCandidate (candidateWeVoteId) {
    // console.log('retrievePositionListsForOneCandidate candidateWeVoteId: ', candidateWeVoteId);
    if (!this.localPositionListHasBeenRetrievedOnce(candidateWeVoteId) &&
      !BallotStore.positionListHasBeenRetrievedOnce(candidateWeVoteId)
    ) {
      CandidateActions.positionListForBallotItemPublic(candidateWeVoteId);
      const { positionListHasBeenRetrievedOnce } = this.state;
      positionListHasBeenRetrievedOnce[candidateWeVoteId] = true;
      this.setState({
        positionListHasBeenRetrievedOnce,
      });
    }
    if (!this.localPositionListFromFriendsHasBeenRetrievedOnce(candidateWeVoteId) &&
      !BallotStore.positionListFromFriendsHasBeenRetrievedOnce(candidateWeVoteId)
    ) {
      CandidateActions.positionListForBallotItemFromFriends(candidateWeVoteId);
      const { positionListFromFriendsHasBeenRetrievedOnce } = this.state;
      positionListFromFriendsHasBeenRetrievedOnce[candidateWeVoteId] = true;
      this.setState({
        positionListFromFriendsHasBeenRetrievedOnce,
      });
    }
    return true;
  }

  localPositionListHasBeenRetrievedOnce (ballotItemWeVoteId) {
    if (ballotItemWeVoteId) {
      const { positionListHasBeenRetrievedOnce } = this.state;
      return positionListHasBeenRetrievedOnce[ballotItemWeVoteId];
    }
    return false;
  }

  localPositionListFromFriendsHasBeenRetrievedOnce (ballotItemWeVoteId) {
    if (ballotItemWeVoteId) {
      const { positionListFromFriendsHasBeenRetrievedOnce } = this.state;
      return positionListFromFriendsHasBeenRetrievedOnce[ballotItemWeVoteId];
    }
    return false;
  }

  render () {
    renderLog('PoliticianPositionRetrieveController');  // Set LOG_RENDER_EVENTS to log all renders
    // console.log('PoliticianPositionRetrieveController render');
    return (
      <span />
    );
  }
}
PoliticianPositionRetrieveController.propTypes = {
  politicianWeVoteId: PropTypes.string,
};

export default PoliticianPositionRetrieveController;
