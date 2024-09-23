import { signIntoGoogle } from "@/actions/auth";

export default function SignIn() {
	
	return (
		<form
			action={signIntoGoogle}
		>
			<button type="submit">Signin with Google</button>
		</form>
	);
}
