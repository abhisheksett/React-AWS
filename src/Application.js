import React, { Component } from 'react';
import NewGrudge from './NewGrudge';
import Grudges from './Grudges';
import './Application.css';

import { API, Storage } from 'aws-amplify';
import { withAuthenticator } from 'aws-amplify-react';

class S3Image extends Component {

  state = { src: null }

  async componentDidMount () {
    const { s3key } = this.props;
    const src = await Storage.get(s3key);
    this.setState({
      src
    })
  }
  
  render() {
    const { src } = this.state;
    if (!src) {
      return null;
    }
    return (
      <article>
        <img src={src} />
      </article>
    )
  }
}

class Application extends Component {
  state = {
    files: [],
    grudges: [],
  };

  async componentDidMount () {
    API.get('grudgesCRUD', '/grudges').then(grudges => {
      console.log('data', { grudges })
      this.setState({
        grudges
      });
    })

    const files = await Storage.list('');
    this.setState({
      files
    })
  }

  handleSubmit = event => {
    event.preventDefault();

    const file = this.fileInput.files[0];
    const { name } = file;

    Storage.put(name, file).then(response => {
      this.setState({
        files: [...this.state.files, response]
      })
    })
  };

  addGrudge = grudge => {
    API.post('grudgesCRUD', '/grudges', { body: grudge }).then(response => {
      console.log(response);
      this.setState({ grudges: [grudge, ...this.state.grudges] });
    })
  };

  removeGrudge = grudge => {
    API.del('grudgesCRUD', `/grudges/object/${grudge.id}`).then(response => {
      console.log(response);
      this.setState({
        grudges: this.state.grudges.filter(other => other.id !== grudge.id),
      });
    })
  };

  toggle = grudge => {
    const updatedGrudge = { ...grudge, avenged: !grudge.avenged };
    API.post('grudgesCRUD', '/grudges', { body: updatedGrudge }).then(response => {
      console.log(response);
      const othergrudges = this.state.grudges.filter(
        other => other.id !== grudge.id,
      );

      this.setState({ grudges: [updatedGrudge, ...othergrudges] });
    })
  };

  render() {
    const { grudges } = this.state;
    const unavengedgrudges = grudges.filter(grudge => !grudge.avenged);
    const avengedgrudges = grudges.filter(grudge => grudge.avenged);

    return (
      <div>
        <div className="Application">
          <NewGrudge onSubmit={this.addGrudge} />
          <Grudges
            title="Unavenged Grudges"
            grudges={unavengedgrudges}
            onCheckOff={this.toggle}
            onRemove={this.removeGrudge}
          />
          <Grudges
            title="Avenged Grudges"
            grudges={avengedgrudges}
            onCheckOff={this.toggle}
            onRemove={this.removeGrudge}
          />
        </div>
        <div className="image">
          <form className="NewItem" onSubmit={this.handleSubmit}>
            <input
              type="file"
              ref={input => this.fileInput = input}
            />
            <input className="full-width" type="submit" />
          </form>
          <section className="Application-images">
            {this.state.files.map(((file, index) => {
              return (<S3Image key={index} s3key={ file.key } />)
            }))}
          </section>
        </div>
      </div>
    );
  }
}

export default withAuthenticator(Application);
