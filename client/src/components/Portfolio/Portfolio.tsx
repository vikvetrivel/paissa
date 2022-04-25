import { createStyles, Group, Title } from "@mantine/core";
import { useState, useEffect } from "react";

import axios from "axios";
import { PortfolioTable } from "./PortfolioTable";

const useStyles = createStyles((theme) => ({
    title: {
        fontSize: 18,
        color:
            theme.colorScheme === "dark"
                ? theme.colors.dark[3]
                : theme.colors.gray[4],
        textTransform: "uppercase",
    },
}));
export default function Portfolio() {
    const { classes } = useStyles();
    const [portfolioData, setportfolioData] = useState([]);

    const getPorfolioData = async () => {
        const { data } = await axios.get(
            `http://192.168.40.118:8000/api/portfolio/`
        );

        setportfolioData(data);
    };
    useEffect(() => {
        getPorfolioData();
    }, []);

    return (
        <div>
            <Title order={4} className={classes.title} py='xs'>
                Portfolio
            </Title>

            <PortfolioTable data={portfolioData} />
        </div>
    );
}
