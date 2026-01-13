import { RootState } from "../../redux/store"
import { useSelector } from "react-redux"
import SearchIcon from '@mui/icons-material/Search';
import HomeIcon from '@mui/icons-material/Home';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import MapsUgcIcon from '@mui/icons-material/MapsUgc';
import './dashboard.css'
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';








function Dashboard(){
      const currentUsers = useSelector((state:RootState) => state.auth.currentUser)
      const Users = useSelector((state:RootState) => state.auth.users)
      console.log("users ",currentUsers)

    return(
        <div className="main-container">
            <header>
            <div className="logo">
            <img src= '/logo.png' alt="Company Logo" width="200" height="50"/>
            </div>
            <div className="icons" >
                <SearchIcon/>
                <MapsUgcIcon/>
                <HomeIcon/>
                <FavoriteBorderIcon/>
                <div className="image"></div>
                
            </div>
            </header>
            <div className="chat-section">
                <div className="users-section">
                    <div className="user-search">
                        <input type="text" className="userSearchInput"/>
                    </div>
                    <div className="users">
                        <TableContainer component={Paper}>
      <Table sx={{ minWidth: 10 }} aria-label="simple table">
        <TableBody>
          {Users.map((row) => (
            <TableRow
              key={row.id}
              sx={{border: 0 ,height:70}}
            >
              <TableCell component="th" scope="row">
                {row.userName || row.email}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>



                    </div>
                </div>
                <div className="chat-page"></div>
            </div>
        
        </div>
    )
}

export default Dashboard