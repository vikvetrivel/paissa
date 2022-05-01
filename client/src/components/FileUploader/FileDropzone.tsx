import {
    Group,
    Text,
    useMantineTheme,
    Stack,
    Button,
    MantineTheme,
    Title,
    Loader,
    Select,
    createStyles,
} from "@mantine/core";
import { CloudUpload } from "tabler-icons-react";
import { Dropzone, DropzoneStatus } from "@mantine/dropzone";
import { useState, useEffect } from "react";

import axios from "axios";
import { useDispatch } from "react-redux";
import { setUnderlyingChanged } from "../Trades/TradesSlice";

interface PortfolioMeta {
    _id: string;
    broker: string;
    label: string;
}

const useStyles = createStyles((theme) => ({
    wrapper: {
        position: "relative",
        marginBottom: 30,
    },

    dropzone: {
        borderWidth: 1,
        paddingBottom: 50,
    },

    icon: {
        color:
            theme.colorScheme === "dark"
                ? theme.colors.dark[3]
                : theme.colors.gray[4],
    },

    control: {
        position: "absolute",
        width: 250,
        left: "calc(50% - 125px)",
        bottom: -20,
    },
}));

function getActiveColor(status: DropzoneStatus, theme: MantineTheme) {
    return status.accepted
        ? theme.colors[theme.primaryColor][6]
        : status.rejected
        ? theme.colors.red[6]
        : theme.colorScheme === "dark"
        ? theme.colors.dark[0]
        : theme.black;
}

export function FileDropZone() {
    const theme = useMantineTheme();
    const [csvFile, setCSVFile] = useState<Blob>();
    const [portfolios, setPortfolios] = useState([]);
    const [selectedPortfolio, setSelectedPortfolio] = useState<string>();

    const [uploadInProgress, setUploadInProgress] =
        useState("Upload Trades CSV");

    const dispatch = useDispatch();

    useEffect(() => {
        // get the available portfolios for this user.

        const getPorfolioMeta = async () => {
            let p = await axios.get("http://localhost:8000/api/portfolio/meta");
            p.data.map((d: any) => (d.label = d.broker));
            setPortfolios(p.data);
            setSelectedPortfolio(p.data[0]._id);
        };

        getPorfolioMeta();
    }, []);

    const uploadFiles = async () => {
        console.log(csvFile);
        setUploadInProgress("Uploading");
        const formData: any = new FormData();
        formData.append("file", csvFile);
        formData.append("pid", selectedPortfolio);

        const headers = {
            "Content-Type": "multipart/form-data",
        };

        const url = "http://localhost:8000/api/importExecutions";

        try {
            const response = await axios.post(url, formData, {
                headers: headers,
            });
            setUploadInProgress("Upload Complete");
            dispatch(setUnderlyingChanged(true));
        } catch (err) {
            console.log(err);
            setUploadInProgress("Upload Failed");
            alert("Oops");
        }
    };

    return (
        <Stack align='center' justify='space-around'>
            <Title order={2}>{uploadInProgress}</Title>
            {uploadInProgress == "Upload Trades CSV" ? (
                <>
                    <Select
                        label='Portfolio'
                        placeholder='Pick one'
                        data={portfolios}
                        onChange={(values) => console.log(values)}
                    />

                    <Dropzone
                        onDrop={(files) => setCSVFile(files[0])}
                        onReject={(files) =>
                            console.log("rejected files", files)
                        }
                        maxSize={3 * 1024 ** 2}
                        accept={["text/csv"]}>
                        {(status) => (
                            <div style={{ pointerEvents: "none" }}>
                                <Group position='center'>
                                    <CloudUpload
                                        size={50}
                                        color={getActiveColor(status, theme)}
                                    />
                                </Group>
                                <Text
                                    align='center'
                                    weight={700}
                                    size='lg'
                                    mt='xl'
                                    sx={{
                                        color: getActiveColor(status, theme),
                                    }}>
                                    {status.accepted
                                        ? "Drop files here"
                                        : status.rejected
                                        ? "Pdf file less than 30mb"
                                        : "Upload Trades CSV"}
                                </Text>
                                <Text
                                    align='center'
                                    size='sm'
                                    mt='xs'
                                    color='dimmed'>
                                    Drag&apos;n&apos;drop files here to upload.
                                    We can accept only <i>.csv</i> files that
                                    are less than 30mb in size.
                                </Text>
                            </div>
                        )}
                    </Dropzone>
                    <Button
                        onClick={() => uploadFiles()}
                        color='orange'
                        disabled={csvFile ? false : true}>
                        Upload Files
                    </Button>
                </>
            ) : uploadInProgress == "Uploading" ? (
                <Loader color='orange' variant='bars' />
            ) : (
                ""
            )}
        </Stack>
    );
}
