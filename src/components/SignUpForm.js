import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { TextField, Button, Checkbox, Radio } from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';

import { Field, Formik, Form, useFormik, useFormikContext } from 'formik';
import { Persist } from 'formik-persist';
import TwitterOauth from './TwitterOauth';
import axios from 'axios';
import { UserQuestionaire } from '../Validations/UserQuestionaire';
import { DiscordWhValidator } from '../Validations/Discord_WH_Validator';

const sleep = (time) => new Promise((acc) => setTimeout(acc, time));

// Initial Values
const formInitialValues = {
	project_name: '',
	website: '',
	main_twitter: '',
	marketplaces: [],
	rarity: '',
	twitter_bots: [],
	discord_bots: [],
	discord_webhook_sales: '',
	discord_webhook_listings: '',
};

export const MyTextField = ({ name, ...props }) => {
	const context = useFormikContext();
	const showError = context.touched[name] && name in context.errors;
	return (
		<TextField
			error={showError}
			helperText={showError && context.errors[name]}
			name={name}
			{...props}
		/>
	);
};

const CheckboxPersists = ({ name, value, label, ...props }) => {
	// <pre>{JSON.stringify(props)}</pre>;
	return (
		<label>
			<Checkbox
				{...props}
				name={name}
				value={value}
				defaultChecked={
					sessionStorage.getItem(name) &&
					sessionStorage.getItem(name).includes(value)
						? true
						: false
				}
			/>
			{label}
		</label>
	);
};

const CheckboxGroup = ({ fields, name, label, className, children }) => {
	let checkboxes = [];
	const hasChildren = React.Children.toArray(children).length > 0;
	for (let key in fields) {
		checkboxes.push(
			<Field
				as={CheckboxPersists}
				value={fields[key].value}
				name={name}
				label={fields[key].label}
				key={checkboxes.length}
			/>
		);
	}
	return (
		<div>
			{label ? (
				<label className={`input-label ${className}`}>{label}</label>
			) : null}

			<div
				className={
					hasChildren ? 'checkbox-group-group' : 'checkbox-group'
				}>
				{checkboxes}
				{children}
			</div>
		</div>
	);
};

const NavigationButtons = ({ step, setStep, isLastStep }) => {
	const { isSubmitting } = useFormikContext();
	return (
		<div className="prev-next-wrapper">
			{step >= 1 ? (
				<Button
					size="large"
					variant="outlined"
					onClick={() => {
						setStep(step - 1);
					}}>
					Back
				</Button>
			) : (
				<div></div>
			)}
			{isSubmitting ? (
				<LoadingButton loading variant="contained" size="large" />
			) : (
				<Button
					size="large"
					type="submit"
					variant={isLastStep ? 'contained' : 'outlined'}>
					{isLastStep ? 'Submit' : 'Next'}
					{isSubmitting && 'loading'}
				</Button>
			)}
		</div>
	);
};

const FormikStepper = ({ step, setStep, children, ...props }) => {
	const formik = useFormik({ initialValues: formInitialValues });
	const childrenArray = React.Children.toArray(children);
	const currentChild = childrenArray[step];
	const totalSteps = childrenArray.length - 1;
	const isLastStep = totalSteps === step;

	const handleSubmit = async (data) => {
		if (!isLastStep) {
			for (let key in data) {
				sessionStorage.setItem(key, data[key]);
			}
			setStep(step + 1);
		} else {
			await props.onSubmit(data);
		}
	};

	return (
		<Formik
			{...props}
			onSubmit={handleSubmit}
			initialValues={formik.initialValues}
			validationSchema={currentChild.props.validationSchema}>
			<Form autoComplete="off">
				{currentChild}

				<NavigationButtons
					step={step}
					setStep={setStep}
					isLastStep={isLastStep}
				/>

				<Persist name="sign-up-form" />
			</Form>
		</Formik>
	);
};

const FormikStep = ({ label, children, validationSchema, ...props }) => {
	return <div className="form">{children}</div>;
};

// Component
const SignUpForm = () => {
	const [step, setStep] = useState(0);
	const [searchParams] = useSearchParams();
	const screen_name = searchParams.get('screen_name') || '';
	const oauth_token = searchParams.get('oauth_token') || '';
	const oauth_token_secret = searchParams.get('oauth_token_secret') || '';
	const user_id = searchParams.get('user_id') || '';

	const navigate = useNavigate();

	const onFormSubmit = async (data) => {
		const myObj = {
			oauth_token_secret,
			oauth_token,
			user_id,
			screen_name,
			...data,
		};

		// Clears storage
		localStorage.clear();

		// POST Request to server -> Discord
		axios
			.post('https://moonbots.herokuapp.com/submit', myObj)
			.then((response) => {});

		// Render's loading button and gives confirmation
		await sleep(1500);

		// Redirects
		navigate('/signup/success');
	};

	// Sets step from seach params it doesn't really work as I would expect but it "works"
	useEffect(() => {
		if (searchParams.get('step') && searchParams.get('step') >= step) {
			setStep(step + 1);
		}
	}, []);

	return (
		<>
			<h2 className="form-heading">Set-up your Moonbot</h2>
			<FormikStepper
				step={step}
				setStep={setStep}
				onSubmit={onFormSubmit}>
				<FormikStep validationSchema={UserQuestionaire}>
					<Field
						name="project_name"
						as={MyTextField}
						label="Project Name"
						type="input"
						placeholder="Solana Monkey Business"
						key="2"
					/>
					<Field
						name="website"
						as={MyTextField}
						label="Website"
						type="input"
						placeholder="https://solanamonkeybusiness.com"
						key="4"
					/>
					<Field
						name="main_twitter"
						as={MyTextField}
						label="Your project's main Twitter handle"
						type="input"
						placeholder="@SolanaMBS"
					/>
					<CheckboxGroup
						name="marketplaces"
						label="Which marketplaces is your collection available in?"
						className="primary-label"
						fields={{
							magic_eden: {
								value: 'magic_eden',
								label: 'Magic Eden',
							},
							solanart: {
								value: 'solanart',
								label: 'Solanart',
							},
							alpha_art: {
								value: 'alpha_art',
								label: 'Alpha Art',
							},
						}}
					/>
					<div>
						<label className="input-label primary-label">
							Rarity Tracking
						</label>
						<div className="checkbox-group">
							<label>
								<Field
									type="radio"
									name="rarity"
									as={Radio}
									value="howRareIs"
								/>
								HowRare.is
							</label>
							<label>
								<Field
									type="radio"
									name="rarity"
									as={Radio}
									value="solanaFloor"
								/>
								MoonRank
							</label>
						</div>
					</div>
					<CheckboxGroup
						label="Choose your Bots"
						className="primary-label">
						<CheckboxGroup
							name="twitter_bots"
							label="Twitter"
							className="secondary-label"
							fields={{
								sales: {
									value: 'sales',
									label: 'Sales',
								},
							}}
						/>

						<CheckboxGroup
							name="discord_bots"
							label="Discord"
							className="secondary-label"
							fields={{
								sales: {
									value: 'sales',
									label: 'Sales',
								},
								listings: {
									value: 'listings',
									label: 'Listings',
								},
							}}
						/>
					</CheckboxGroup>
				</FormikStep>
				<TwitterOauth screen_name={screen_name} validationSchema="" />
				<FormikStep validationSchema={DiscordWhValidator}>
					<label>
						Please provide a webhook for your discord channel. This
						allows MoonBots to post in your channel. If you need
						help (
						<a
							className="link"
							target="_blank"
							rel="noreferrer"
							href="https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks">
							See Instructions
						</a>
						). If you only want a twitter bot, skip this step.
					</label>
					<Field
						name="discord_webhook_listings"
						as={MyTextField}
						label="Listings Channel Webhook"
						type="input"
						placeholder="https://discord.com/api/webhooks/926480261779189850/BKkflkmfeyDt_34IKgJnfvO0OBe3tumQ_oXQrn9c58FgijzUMRtyqpshZxfdc344RY7434pQ9"
					/>
					<Field
						name="discord_webhook_sales"
						as={MyTextField}
						label="Sales Channel Webhook"
						type="input"
						placeholder="https://discord.com/api/webhooks/926480261779189850/BKkflkmfeyDt_34IKgJnfvO0OBe3tumQ_oXQrn9c58FgijzUMRtyqpshZxfdc344RY7434pQ9"
					/>
				</FormikStep>
			</FormikStepper>
		</>
	);
};

export default SignUpForm;
