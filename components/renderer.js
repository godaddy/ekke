import React, { Component } from 'react';
import Loading from './loading';

/**
 * @callback ReadyFn
 * @param {Component.prototype.setState} setState Bound setState function of the component.
 */
/**
 * Create a new renderer which will be used as new application root.
 *
 * @param {ReadyFn} ready Called when our component is ready for changes.
 * @returns {Component} Renderer.
 * @public
 */
function createRenderer(ready) {
  return class Renderer extends Component {
    constructor() {
      super(...arguments);
      //
      // Use state so we can dynamically change the views we are rendering.
      //
      this.state = {
        component: <Loading />
      };
    }

    /**
     * Call our initializer with our setState method so we can process
     * layout changes.
     *
     * @public
     */
    componentDidMount() {
      ready(this.setState.bind(this));
    }

    /**
     * Renders the actual component.
     *
     * @returns {Component} A view, with the component to render.
     * @public
     */
    render() {
      return <React.Fragment>{this.state.component}</React.Fragment>;
    }
  };
}

export {
  createRenderer as default,
  createRenderer
};
