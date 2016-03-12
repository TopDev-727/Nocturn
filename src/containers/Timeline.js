import React, { PropTypes } from 'react';
import ListSelector         from './ListSelector'
import SearchBox            from './SearchBox'
import TweetList            from './TweetList'
import TweetTab             from './TweetTab'
import Actions              from '../actions';
import TwitterClient        from '../utils/TwitterClient'
import TimelineProxy        from '../utils/TimelineProxy'
import { connect }          from 'react-redux';

class Timeline extends React.Component {
  static propTypes = {
    account:       PropTypes.object.isRequired,
    activeAccount: PropTypes.object,
    selectedTab:   PropTypes.string.isRequired,
    tweetsByTab:   PropTypes.object.isRequired,
    addTweet:      PropTypes.func.isRequired,
    setLists:      PropTypes.func.isRequired,
  }

  componentDidMount() {
    this.loadHome();
    this.loadMentions();
    this.loadLists();
    this.startStreaming();
  }

  loadHome() {
    let proxy = new TimelineProxy(this.props.addTweet, this.props.account);
    this.client().homeTimeline((tweets) => {
      for (let tweet of tweets) {
        proxy.addTweet(tweet, this.props.account, 'home');
      }
    })
  }

  loadMentions() {
    let proxy = new TimelineProxy(this.props.addTweet, this.props.account);
    this.client().mentionsTimeline((tweets) => {
      for (let tweet of tweets) {
        proxy.addTweet(tweet, this.props.account, 'mentions');
      }
    })
  }

  loadLists() {
    this.client().listsList((lists) => {
      for (let list of lists) {
        this.props.setLists(lists, this.props.account);
      }
    });
  }

  startStreaming() {
    let proxy = new TimelineProxy(this.props.addTweet, this.props.account);
    this.client().userStream((tweet) => {
      proxy.addTweet(tweet, this.props.account, 'home');
    });
  }

  tabPropsFor(tab) {
    return {
      account: this.props.account,
      tab:     tab,
    };
  }

  listPropsFor(tab) {
    return {
      tab:     tab,
      tweets:  this.props.tweetsByTab[tab] || [],
      account: this.props.account,
    };
  }

  client() {
    return new TwitterClient(this.props.account);
  }

  render() {
    return(
      <div className={this.props.account.id == this.props.activeAccount.id ? 'timeline active' : 'timeline'}>
        <ul className='tabs clearfix'>
          <TweetTab account={this.props.account} tab='home'>Timeline</TweetTab>
          <TweetTab account={this.props.account} tab='mentions'>Mentions</TweetTab>
          <TweetTab account={this.props.account} tab='lists'>Lists</TweetTab>
          <TweetTab account={this.props.account} tab='search'>Search</TweetTab>
        </ul>

        <TweetList {...this.listPropsFor('home')} />
        <TweetList {...this.listPropsFor('mentions')} />
        <TweetList {...this.listPropsFor('lists')}  withHeader={true}/>
        <TweetList {...this.listPropsFor('search')} withHeader={true}/>

        <ListSelector account={this.props.account} />
        <SearchBox account={this.props.account} />
      </div>
    );
  }
}

const mapStateToProps = (state, props) => {
  return {
    activeAccount: state.accounts[state.activeAccountIndex],
    tweetsByTab:   state.tabsByUserId[props.account.id] || {},
    selectedTab:   state.selectedTabByUserId[props.account.id] || 'home',
  };
}

export default connect(mapStateToProps, {
  ...Actions.tweets,
  ...Actions.lists,
})(Timeline);
