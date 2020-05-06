import React from "react";
import ReactDOM from "react-dom";
import PlasticityRoot from './js/plasticity.jsx';

$(document).ready(() => {
    ReactDOM.render(
        <PlasticityRoot />,// <PlasticityRoot />,
        document.getElementById('root')
    );
});