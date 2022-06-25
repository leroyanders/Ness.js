import React from 'react'

function Title(props) {
  return (
    <h1 className={props.styles.heading30}>
      Welcome to <b className={props.styles.welcomeTitle}>{props.title || "Ness.js"}</b>
    </h1>
  )
}

export default Title;