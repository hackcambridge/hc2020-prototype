import React, { Component } from "react";
import { Page, Card, Banner, DropZone, Button, ButtonGroup, Stack, Subheading, TextStyle, TextField, Heading, PageActions, Layout, Select, FormLayout, Modal, TextContainer, Checkbox, DatePicker } from "@shopify/polaris";
import axios from 'axios';
import { IApplicationRecord } from "../../../interfaces/dashboard.interfaces";
import countryList from 'country-list';
import { toast } from 'react-toastify';

interface IApplyProps {
    canEdit: boolean,
    initialRecord: IApplicationRecord | undefined,
    updateApplication: (application: IApplicationRecord) => void,
}

interface IApplyState {
    uploadedFileURL?: string | undefined,
    uploadedFileName?: string | undefined,
    isUploadingFile: boolean,
    isSaving: boolean,
    questionValues: { [key: string]: string },
    isSubmitted: boolean,
    countrySelection: string,

    showingVisaDateSelector: boolean,
    visaRequired: boolean,
    visaPickerMonthYear: { month: number, year: number },
    visaDate: Date | undefined,
    visaDateTemp: Date | undefined,
}

function RequiredStar() {
    return <span style={{ color: "red" }}>*</span>;
}

class Apply extends Component<IApplyProps, IApplyState> {

    state = {
        isUploadingFile: false,
        isSaving: false,
        showingVisaDateSelector: false,
        uploadedFileName: this.props.initialRecord ? (this.props.initialRecord.cvFilename || "") : "",
        uploadedFileURL: this.props.initialRecord ? (this.props.initialRecord.cvUrl || "") : "",
        questionValues: (this.props.initialRecord ? JSON.parse(this.props.initialRecord.questionResponses) : {}) as { [key: string]: string },
        isSubmitted: this.props.initialRecord ? this.props.initialRecord.isSubmitted : false,
        countrySelection: this.props.initialRecord ? this.props.initialRecord.country : "GB",
        visaRequired: this.props.initialRecord ? this.props.initialRecord.visaRequired : false,
        visaPickerMonthYear: { month: new Date().getMonth(), year: new Date().getFullYear() },
        visaDate: this.props.initialRecord 
            ? (this.props.initialRecord.visaRequiredDate ? new Date(this.props.initialRecord.visaRequiredDate) : undefined)
            : undefined,
        visaDateTemp: this.props.initialRecord 
            ? (this.props.initialRecord.visaRequiredDate ? new Date(this.props.initialRecord.visaRequiredDate) : undefined)
            : undefined,
    }


    private textFieldQuestions: { id: string, title: string, placeholder: string }[] = [
        { id: "1", title: "What do you want to get out of this event?", placeholder: "" },
        { id: "2", title: "What are you interested in?", placeholder: "Mention anything you want -- it doesn’t have to be technology-related!" },
        { id: "3", title: "Tell us about a recent accomplishment you’re proud of.", placeholder: "" },
        { id: "4", title: "Are there any links you’d like to share so we can get to know you better?", placeholder: "For example GitHub, LinkedIn or your website. Put each link on a new line. " },
    ]

    private buildFileSelector() {
        const fileSelector = document.createElement('input');
        fileSelector.setAttribute('type', 'file');
        fileSelector.setAttribute('accept', 'application/pdf');
        fileSelector.onchange = (_) => {
            if(!this.state.isUploadingFile) {
                this.setState({ isUploadingFile: true });
            }
            // console.log(fileSelector.files);

            if(fileSelector.files) {
                const file = fileSelector.files.item(0);
                if(file) {
                    // Upload file.
                    this.saveForm(
                        this.state.isSubmitted, 
                        () => toast.success("CV uploaded."),
                        file
                    );
                    return;
                } 
            }
            toast.error("An error occurred while uploading the file.");
            this.setState({ isUploadingFile: false });
        }
        fileSelector.onclick = (_) => {
            fileSelector.value = "";
        }
        return fileSelector;
    }

    private fileSelector: HTMLElement
    componentDidMount(){
        this.fileSelector = this.buildFileSelector();
        this.loadApplicationRecord();
    }

    handleFileSelect = () => {
        // e.preventDefault();
        this.fileSelector.click();
    }

    handleCVRemove = () => {
        this.setState({ isSaving: true });
        axios.post(`/dashboard-api/remove-cv.json`, {}).then(res => {
            const status = res.status;
            if(status == 200) {
                const payload = res.data;
                // console.log(payload);
                if("success" in payload && payload["success"]) {
                    this.setState({
                        uploadedFileName: "",
                        uploadedFileURL: "",
                    });
                    this.saveForm(this.state.isSubmitted, () => toast.info("CV removed"));
                } else {
                    toast.error("Failed to remove CV.")
                    this.setState({ isSaving: false });
                }
            }
        });
    }

    private saveForm(submitted: boolean, customToast?: () => void, cv?: File) {
        this.setState({ isSaving: true });
        this.updateRecordInDatabase(submitted, customToast, cv);
    }

    render() {
        const { 
            isUploadingFile, 
            uploadedFileName, 
            uploadedFileURL, 
            questionValues,
            isSubmitted,
            isSaving,
            countrySelection,
            showingVisaDateSelector,
            visaRequired,
            visaDate,
        } = this.state;

        const countriesNoGB = countryList().getData()
            .filter(({ code }: { code: string }) => code !== "GB")
            .map(({ code, name }: { code: string, name: string }) => {
                return { label: name, value: code };
            });
        const countries: { value: string, label: string }[] = [
            { value: "GB", label: "United Kingdom" },
            ...countriesNoGB
        ]

        return (
            <Page title={"Apply for Hack Cambridge"}>
                <Banner status="info">
                    {this.props.canEdit 
                        ? <p>You change this information at any time before the application deadline.</p>
                        : <p>Applications have now closed.</p>
                    }
                </Banner>
                <br />
                <Card sectioned>
                    <FormLayout>
                        <FormLayout.Group>
                            <>
                            <div style={{ paddingBottom: "12px", paddingTop: "0px" }}>
                                <Heading>CV / Resume</Heading>
                            </div>
                            {uploadedFileName.length > 0 
                                ?   <ButtonGroup segmented>
                                        <Button outline size="slim" url={uploadedFileURL} external={true}>{uploadedFileName}</Button>
                                        <Button destructive size="slim" onClick={this.handleCVRemove} disabled={!this.props.canEdit || isSaving}>Remove</Button>
                                    </ButtonGroup>
                                :   <Button size="slim" loading={isUploadingFile} onClick={this.handleFileSelect} disabled={!this.props.canEdit}>Upload CV</Button>
                            }
                            </>
                            <>
                            <div style={{ paddingBottom: "12px", paddingTop: "0px" }}>
                                <Heading>Country travelling from:</Heading>
                            </div>
                            <Select
                                label=""
                                options={countries}
                                onChange={(value) => this.setState({ countrySelection: value })}
                                value={countrySelection}
                                disabled={!this.props.canEdit || isSaving}
                            />
                            </>
                        </FormLayout.Group>
                    </FormLayout>
                </Card>
                <br />

                <Card sectioned>
                    {this.textFieldQuestions.map((q, index) => {
                        return (
                            <div key={q.id}>
                                <div style={{ paddingBottom: "12px", paddingTop: (index == 0 ? "0" : "20px") }}>
                                    <Heading>{q.title}</Heading>
                                </div>
                                <TextField
                                    id={q.id}
                                    label=""
                                    value={q.id in questionValues ? questionValues[q.id] : ""}
                                    onChange={(value) => {
                                        const newValues = questionValues;
                                        newValues[q.id] = value;
                                        this.setState({ questionValues: newValues });
                                    }}
                                    multiline={4}
                                    placeholder={q.placeholder}
                                    disabled={!this.props.canEdit}
                                    maxLength={200}
                                    showCharacterCount
                                />
                            </div>
                        );
                    })}
                </Card>

                <Card sectioned title={"Visas"}>
                    <TextContainer>
                        We understand that some of our participants will need more time than others to organise a visa for their trip to Hack Cambridge. If this affects you we are are willing to help, ensuring we give you a decision on an invitation in time to start the process of requesting one.
                    </TextContainer>
                    <br />
                    <FormLayout>
                        <FormLayout.Group>
                            <>
                            <div style={{ paddingBottom: "10px", paddingTop: "10px" }}>
                                <Subheading>Visa required?</Subheading>
                            </div>
                            <Checkbox
                                label="I will need a visa to attend."
                                checked={visaRequired}
                                onChange={(val) => this.setState({ visaRequired: val })}
                            />
                            </>
                            {visaRequired ?
                                <>
                                <div style={{ paddingBottom: "8px", paddingTop: "10px" }}>
                                    <Subheading>What is the deadline for organising a visa?</Subheading>
                                </div>
                            <Button size={"slim"} onClick={() => this.setState({ showingVisaDateSelector: true })}>
                                {visaDate 
                                    ? `${visaDate.getDate()} ${visaDate.toLocaleString('default', { month: 'long' })} ${visaDate.getFullYear()}`
                                    : "(No date selected)"
                                }
                            </Button>
                            </>
                            : <></>}
                        </FormLayout.Group>    
                    </FormLayout>
                </Card>

                {this.props.canEdit ? <>
                    {isSubmitted 
                        ? <div id="save-button-group">
                            <div style={{ float: "left", padding: "30px 0" }}>
                                <Button destructive loading={isSaving} onClick={() => this.saveForm(false)}>Unsubmit</Button>
                            </div>
                            <div style={{ float: "right", padding: "30px 0" }}>
                                <Button loading={isSaving} primary onClick={() => this.saveForm(true)}>Update</Button>
                            </div>
                        </div>
                        : <div id="save-button-group" style={{ float: "right", padding: "30px 0" }}>
                            <ButtonGroup segmented>
                                <Button loading={isSaving} onClick={() => this.saveForm(false)}>Save Draft</Button>
                                <Button loading={isSaving} primary onClick={() => this.saveForm(true)}>Submit</Button>
                            </ButtonGroup>
                        </div>
                    }
                </> : <></>}

                <Modal
                    title={"Deadline for organising a visa"}
                    open={showingVisaDateSelector}
                    onClose={() => this.setState({ 
                        showingVisaDateSelector: false,
                        visaDateTemp: this.state.visaDate,
                        visaPickerMonthYear: { month: new Date().getMonth(), year: new Date().getFullYear() },
                    })}
                    primaryAction={{
                        content: 'Save Date',
                        onAction: () => this.setState({ 
                            showingVisaDateSelector: false,
                            visaDate: this.state.visaDateTemp,
                            visaPickerMonthYear: { 
                                month: (this.state.visaDateTemp || new Date()).getMonth(), 
                                year: (this.state.visaDateTemp || new Date()).getFullYear()
                            },
                        }),
                    }}
                >
                    <Modal.Section>
                        <TextContainer>
                            {this.buildDatePicker()}
                        </TextContainer>
                    </Modal.Section>
                </Modal>

            </Page>
        );
    }

    private updateRecordInDatabase(isSubmitted: boolean, toaster?: () => void, cv?: File) {
        const questionValues = this.state.questionValues;
        const questions: { [key : string]: string } = {};
        this.textFieldQuestions.forEach(q => {
            questions[q.id] = q.id in questionValues ? questionValues[q.id] : ""
        });

        let formData = new FormData();
        formData.append('questionResponses', JSON.stringify(questions));
        formData.append('country', this.state.countrySelection);
        formData.append('visaRequired', this.state.visaRequired ? "true" : "false");
        formData.append('visaRequiredDate', (this.state.visaDate || "").toString());
        formData.append('isSubmitted', isSubmitted ? "true" : "false");
        if(cv) formData.append('cvFile', cv);
        // const payload: any = {
        //     questionResponses: JSON.stringify(questions),
        //     country: this.state.countrySelection,
        //     visaRequired: this.state.visaRequired,
        //     visaRequiredDate: (this.state.visaDate || "").toString(),
        //     isSubmitted: isSubmitted,
        // };
        // if(cv) payload.cvFile = cv;
        // formData.forEach((val,key,p) => {
        //     console.log(`${key}: ${val}`);
        // });
        axios.post(`/dashboard-api/update-application.json`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        }).then(res => {
            // console.log(res);
            const status = res.status;
            if(status == 200) {
                const payload = res.data;
                if("success" in payload && payload["success"]) {
                    const record: IApplicationRecord = payload["payload"];
                    this.props.updateApplication(record);

                    if(toaster) { toaster(); }
                    else { toast.success("Application saved."); }
                    this.setState({ 
                        isSubmitted: isSubmitted, 
                        isSaving: false, 
                        isUploadingFile: false, 
                        uploadedFileURL: record.cvUrl,
                        uploadedFileName: record.cvFilename,
                    });
                    return;
                }
            }
            toast.error("An error occurred.");
            // console.log(status, res.data);
            this.setState({ isSaving: false, isUploadingFile: false, });
        });
    }

    private loadApplicationRecord() {
        axios.get(`/dashboard-api/application-record.json`).then(res => {
            const status = res.status;
            if(status == 200) {
                const obj = res.data;
                if ("success" in obj && obj["success"]) {
                    const record: IApplicationRecord = obj["record"] as IApplicationRecord;
                    if(record) {
                        this.setState({
                            uploadedFileName: record.cvFilename || "",
                            uploadedFileURL: record.cvUrl || "",
                            questionValues: JSON.parse(record.questionResponses) as { [key: string]: string },
                            countrySelection: record.country,
                            isSubmitted: record.isSubmitted,
                        });
                    }
                    return;
                }
            }
        });
    }

    private buildDatePicker() {
        const { visaPickerMonthYear, visaDateTemp } = this.state;
        return (
            <DatePicker
                disableDatesBefore={new Date()}
                disableDatesAfter={new Date('Fri Jan 17 2020 00:00:00 GMT')} // The event date
                month={visaPickerMonthYear.month}
                year={visaPickerMonthYear.year}
                onChange={(dates) => this.setState({ visaDateTemp: dates.start })}
                onMonthChange={(month, year) => this.setState({ visaPickerMonthYear: { month: month, year: year } })}
                selected={{
                    start: visaDateTemp || new Date(),
                    end: visaDateTemp || new Date(),
                }}
            />
        );
      }
}

export default Apply;