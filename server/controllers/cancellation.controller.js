
const cancellationRequest = async (req, res) => {
    try {
        return res.status(200).json({ success: true, message: "Cancellation Approved successfully", data: [] });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server Error" });
    }
};

module.exports = { cancellationRequest };
