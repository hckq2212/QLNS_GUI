import AssigningProject from "../components/AssigningProject"
import PendingProject from "../components/PendingProject"
import NotAssignedProject from "../components/NotAssignedProject"
import AssigningJob from "../components/AssigningJob"

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