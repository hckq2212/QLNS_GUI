import AssigningProject from "../components/Project/AssigningProject.jsx"
import PendingProject from "../components/Project/PendingProject.jsx"
import NotAssignedProject from "../components/Project/NotAssignedProject.jsx"
import AssigningJob from "../components/Job/AssigningJob.jsx"

export default function Project () {
    return(
        <div>
            <AssigningProject />
            <PendingProject />
            <NotAssignedProject />
            <AssigningJob />
        </div>
    )
}