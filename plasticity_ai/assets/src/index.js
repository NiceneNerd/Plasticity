import React from "react";
import ReactDOM from "react-dom";
import App from './js/App.jsx';

$(document).ready(() => {
    ReactDOM.render(
        <App />,// <PlasticityRoot />,
        document.getElementById('root')
    );
});