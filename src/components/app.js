import React, { Component } from 'react';
import Mapview from './mapview'
import Header from './header/header'
import { fetchRequest } from '../utils/fetch/fetch'
import { getLocation } from '../utils/getLocation/getLocation'

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      query: {
        centre_lat: null,
        centre_lon: null,
        nearby_radius: 20,
        by_distance: "desc",
      },
      // Loader will show whenever state.stashpoints is null
      stashpoints: null,
      // errMsg will show if not null
      errMsg: null
    };
  }

  componentDidMount() {
    // https://reactjs.org/blog/2018/03/27/update-on-async-rendering.html
    this._asyncRequest = getLocation().then(
      position => {
        this._asyncRequest = null;
        if (position.coords) {
          this.setState(prevState => {
            return {
              query: {
                centre_lat: position.coords.latitude,
                centre_lon: position.coords.longitude,
                nearby_radius: prevState.query.nearby_radius,
                by_distance: prevState.query.by_distance,
              },
              stashpoints: prevState.stashpoints
            }
          })
        } else {
          alert('Geolocation is not supported by this browser.');
        }
      }).then(() => {
        fetchRequest(this.state.query).then(data => {
          this.setState({ stashpoints: data });
        })
      }).catch(error => {
        // TODO refactor error handling into module
        const errorName = Object.getPrototypeOf(error).constructor.name;

        this.setState(prevState => {
          if (errorName === 'PositionError') {
            return {
              query: prevState.query,
              stashpoints: prevState.stashpoints,
              errMsg: `Error: ${error.message}.\nThere was an error establishing your geolocation.\nPlease refresh the page to try again.`
            };
          } else if (errorName === 'FetchError') {
            console.log(error)
            return {
              query: prevState.query,
              stashpoints: prevState.stashpoints,
              errMsg: 'Oops! We seem to be experiencing a problem. Please try again later.'
            };
          } else {
            console.log('else:', error)
          }
        });
        console.log(this.state)
      })
  }

  componentWillUnmount() {
    if (this._asyncRequest) {
      this._asyncRequest.cancel();
    }
  }

  // Filter Handler to update state
  // TODO: refactor to handle various filter types based on button values passed via event. 
  handle247 = () => {
    this.setState(prevState => {
      if (prevState.query.twentyfour_seven) {
        return {
          query: {
            centre_lat: prevState.query.centre_lat,
            centre_lon: prevState.query.centre_lon,
            nearby_radius: prevState.query.nearby_radius,
            by_distance: prevState.query.by_distance,
          },
          stashpoints: null
        }
      } else {
        return {
          query: {
            centre_lat: prevState.query.centre_lat,
            centre_lon: prevState.query.centre_lon,
            nearby_radius: prevState.query.nearby_radius,
            by_distance: prevState.query.by_distance,
            twentyfour_seven: true
          },
          stashpoints: null
        }
      }
    })
  }

  // Whenever state changes, compares length of State.query object to determine if new fetch request to CityStasher API required.
  componentDidUpdate(prevProps, prevState) {
    const query = this.state.query;
    const prevQuery = prevState.query;
    if (Object.keys(query).length !== Object.keys(prevQuery).length) {
      fetchRequest(this.state.query).then(data => {
        this.setState({ stashpoints: data });
      })
    }
  }

  render() {
    return (
      <div className="app" >
        <Header handle247={this.handle247} />
        {
          (this.state.errMsg !== null)
            ? (<h5 className="error-message">{this.state.errMsg}</h5>)
            : ((this.state.stashpoints === null)
              ? (<div className="loader" />)
              : (<Mapview stashpoints={this.state.stashpoints} lat={this.state.query.centre_lat} long={this.state.query.centre_lon}></Mapview>))
        }
      </div>
    )
  }
}

export default App;