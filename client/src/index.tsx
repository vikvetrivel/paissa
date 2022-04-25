import React from "react";
import ReactDOM from "react-dom";
import PaissaApp from "./PaissaApp";
import { MantineProvider } from "@mantine/core";
import "normalize.css";
import { store } from "./store";
import { Provider } from "react-redux";

ReactDOM.render(
    <React.StrictMode>
        <Provider store={store}>
            <MantineProvider
                theme={{
                    // Override any other properties from default theme
                    colorScheme: "dark",
                    loader: "bars",
                }}>
                <PaissaApp />
            </MantineProvider>
        </Provider>
    </React.StrictMode>,
    document.getElementById("root")
);
