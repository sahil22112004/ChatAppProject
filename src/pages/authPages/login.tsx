import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Box, TextField, Button, Typography, InputAdornment, IconButton, Divider } from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import GoogleIcon from '@mui/icons-material/Google';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import * as z from 'zod';
import { Link as RouterLink } from "react-router";
import Link from '@mui/material/Link';
import { handleCurrentUser } from "../../redux/slice/authSlice"
import { useSnackbar } from 'notistack';
import { useDispatch } from 'react-redux'
import { useNavigate } from "react-router";
import { useState } from 'react';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, db } from '../../firebase/firebase';
import { getDocs, query, where, setDoc, doc, updateDoc, collection, serverTimestamp } from "firebase/firestore";
import './auth.css';

function Login() {
  let navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar()
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch()

  const loginSchema = z.object({
    email: z
      .string()
      .min(1, 'Email is required')
      .email("This is not a valid email."),
    password: z
      .string()
      .trim()
      .min(1, 'Password is required')
      .min(6, 'Password must be at least 6 characters'),
  });

  type LoginInterface = z.infer<typeof loginSchema>

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInterface>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (user: LoginInterface) => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, user.email, user.password);
      const firebaseUser = userCredential.user;
      
      const ref = doc(db, "users", firebaseUser.uid)
      await updateDoc(ref, {
        isOnline: true
      });

      dispatch(
        handleCurrentUser({
          id: firebaseUser.uid,
          userName: firebaseUser.displayName || null,
          email: firebaseUser.email,
          photoUrl: firebaseUser.photoURL,
        })
      );
      
      enqueueSnackbar("Welcome back!", { variant: 'success', autoHideDuration: 3000 });
      navigate("/Dashboard");
    } catch (error: any) {
      console.error(error);
      enqueueSnackbar(error.message || "Login failed", { variant: 'error', autoHideDuration: 3000 });
    } finally {
      setLoading(false);
    }
  }

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const response = await signInWithPopup(auth, googleProvider);
      const firebaseUser = response.user;
      
      const existingQuery = query(
        collection(db, "users"),
        where("email", "==", firebaseUser.email)
      );
      const existed = await getDocs(existingQuery);

      if (existed.empty) {
        await setDoc(doc(db, "users", firebaseUser.uid), {
          id: firebaseUser.uid,
          userName: firebaseUser.displayName || null,
          email: firebaseUser.email,
          photoUrl: firebaseUser.photoURL,
          provider: "google",
          createdAt: serverTimestamp(),
          isOnline: true
        });
      } else {
        const ref = doc(db, "users", firebaseUser.uid)
        await updateDoc(ref, {
          isOnline: true
        });
      }

      dispatch(
        handleCurrentUser({
          id: firebaseUser.uid,
          userName: firebaseUser.displayName || null,
          email: firebaseUser.email,
          photoUrl: firebaseUser.photoURL,
        })
      );

      enqueueSnackbar("Signed in with Google!", { variant: 'success', autoHideDuration: 3000 });
      navigate("/Dashboard");
    } catch (error: any) {
      console.error("Google Sign-in Error:", error);
      enqueueSnackbar(error.message, { variant: 'error', autoHideDuration: 3000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="auth-container">
      <div className="auth-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      <div className="auth-card">
        <div className="auth-header">
          <div className="logo-container">
            <ChatBubbleIcon className="logo-icon" />
            <h1>ChatApp</h1>
          </div>
          <h2>Welcome Back</h2>
          <p>Sign in to continue your conversations</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <div className="form-field">
                <TextField
                  {...field}
                  label="Email Address"
                  variant="outlined"
                  fullWidth
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon className="input-icon" />
                      </InputAdornment>
                    ),
                  }}
                />
              </div>
            )}
          />

          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <div className="form-field">
                <TextField
                  {...field}
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  variant="outlined"
                  fullWidth
                  error={!!errors.password}
                  helperText={errors.password?.message}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon className="input-icon" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword((prev) => !prev)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </div>
            )}
          />

          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            disabled={loading}
            className="submit-btn"
          >
            {loading ? (
              <>
                <div className="button-spinner"></div>
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </Button>

          <Divider className="divider">
            <span className="divider-text">OR</span>
          </Divider>

          <Button
            onClick={signInWithGoogle}
            variant="outlined"
            size="large"
            fullWidth
            disabled={loading}
            className="google-btn"
            startIcon={<GoogleIcon />}
          >
            Continue with Google
          </Button>
        </form>

        <Typography className="auth-footer">
          Don't have an account?
          <Link component={RouterLink} to="/Register" className="auth-link">
            Sign up
          </Link>
        </Typography>
      </div>
    </Box>
  );
}

export default Login;