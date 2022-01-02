import React, { useState, useEffect } from 'react'

const Contact = ({ setPage }) => {

    useEffect(() => {
        setPage("contact")
    }, [])

    return (
        <div style={{ minHeight: "89vh" }}>
            <p>Contact</p>
        </div>
    );
}


export default Contact