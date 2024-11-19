import "antd/dist/reset.css";
import { useState, useEffect } from "react";
import {
  Button,
  Input,
  Card,
  Avatar,
  List,
  Row,
  Col,
  Typography,
  DatePicker,
  message,
  Modal,
  Empty
} from "antd";
import dayjs from "dayjs";

const { Title } = Typography;

function App() {
  const [users, setUsers] = useState([]);
  const [newUserName, setNewUserName] = useState("");
  const [selectedUserId, setSelectedUserId] = useState(1);
  const [exerciseData, setExerciseData] = useState({
    description: "",
    duration: "",
    date: null
  });
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/users");
        if (!response.ok) throw new Error("Failed to fetch users");

        const users = await response.json();
        console.log("added users : ", users);
        
        setUsers(
          users.map((user) => ({ ...user, exercises: user.exercises || [] }))
        );
      } catch (error) {
        message.error("Error fetching users: " + error.message);
      }
    };

    fetchUsers();
  }, []);

  const addUser = async () => {
    if (newUserName.trim()) {
      try {
        const response = await fetch("http://localhost:8000/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: newUserName.trim() })
        });
        if (!response.ok) throw new Error("Failed to add user");

        const newUser = await response.json();
        setUsers([
          ...users,
          { id: newUser.id, name: newUser.username, exercises: [] }
        ]);
        setNewUserName("");
        message.success("User added successfully");
      } catch (error) {
        message.error("Error adding user: " + error.message);
      }
    }
  };

  const handleModalOpen = () => setIsModalVisible(true);
  const handleModalClose = () => {
    setExerciseData({ description: "", duration: "", date: null });
    setIsModalVisible(false);
  };

  const addExercise = async () => {
    if (
      exerciseData.description.trim() &&
      exerciseData.duration &&
      exerciseData.date &&
      selectedUserId !== null
    ) {
      const newExercise = {
        description: exerciseData.description.trim(),
        duration: Number(exerciseData.duration),
        date: exerciseData.date.format("YYYY-MM-DD")
      };

      try {
        const response = await fetch(
          `http://localhost:8000/api/users/${selectedUserId}/exercises`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newExercise)
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to add exercise");
        }

        const result = await response.json();
        setUsers(
          users.map((user) =>
            user.id === selectedUserId
              ? { ...user, exercises: [...(user.exercises || []), result] }
              : user
          )
        );

        setExerciseData({ description: "", duration: "", date: null });
        handleModalClose();
        message.success("Exercise added successfully");
      } catch (error) {
        message.error("Error adding exercise: " + error.message);
      }
    }
  };

  useEffect(() => {
    if (!selectedUserId) return;

    const fetchUsers = async () => {
      try {
        const response = await fetch(
          `http://localhost:8000/api/users/${selectedUserId}/logs`
        );
        if (!response.ok) throw new Error("Failed to fetch users");

        const data = await response.json();
    
        // Set the exercise data to an empty array if there are no exercises
        setExerciseData(data);
      
      } catch (error) {
        // Handle error by showing an empty exercise list and showing error message
        // setExerciseData([]);
        message.error("Error fetching users: " + error.message);
      }
    };

    fetchUsers();
  }, [selectedUserId], exerciseData.logs);

  const selectedUser = users.find((user) => user.id === selectedUserId);

  return (
    <div style={{ maxWidth: "80%", margin: "0 auto", padding: "2rem" }}>
      <Title level={2} className="text-center mb-6">
        Exercise Tracker
      </Title>

      <Card
        title="Add New User"
        className="mb-6"
        style={{
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          borderRadius: "8px",
          marginBottom: "20px"
        }}
      >
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Input
              placeholder="Enter user name"
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              style={{ padding: "8px" }}
            />
          </Col>
          <Col>
            <Button type="primary" onClick={addUser}>
              Add User
            </Button>
          </Col>
        </Row>
      </Card>

      <Row gutter={24}>
        <Col xs={24} md={12}>
          <Card
            title="Users"
            style={{
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              borderRadius: "8px"
            }}
          >
            <div style={{ maxHeight: "500px", overflowY: "auto" }}>
              <List
                dataSource={users}
                renderItem={(user) => (
                  <List.Item
                    onClick={() => setSelectedUserId(user.id)}
                    style={{
                      cursor: "pointer",
                      backgroundColor:
                        selectedUserId === user.id ? "#e6f7ff" : "transparent",
                      borderRadius: "4px",
                      padding: "10px",
                      marginBottom: "5px"
                    }}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar>
                          {(user.username && user.username[0]?.toUpperCase()) ||
                            "N"}
                        </Avatar>
                      }
                      title={
                        <span style={{ fontWeight: "bold" }}>
                          {user.username
                            ? user.username[0].toUpperCase() +
                              user.username.slice(1)
                            : "No Name"}
                        </span>
                      }
                    
                    />
                  </List.Item>
                )}
              />
            </div>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card
            title="Add Exercise"
            style={{
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              borderRadius: "8px",
              position: "relative",
              height: "100%",
              minHeight: "500px",
              overflowY: "auto"
            }}
          >
            {/* Display Empty component if no exercises are present */}
            <div style={{ maxHeight: "460px", overflowY: "auto" }}>
              {/* Check if no exercises exist in logs and other properties are empty */}
              {(!exerciseData.logs || exerciseData.logs.length === 0) &&
              !exerciseData.description &&
              !exerciseData.duration &&
              !exerciseData.date ? (
                <Empty description="No exercises added" />
              ) : (
                // Display the list if there are exercises in logs
                selectedUserId &&
                exerciseData.logs &&
                exerciseData.logs.length > 0 && (
                  <List
                    dataSource={exerciseData.logs}
                    renderItem={(exercise) => (
                      <List.Item>
                        <List.Item.Meta
                          title={exercise.description}
                          description={`Duration: ${exercise.duration} mins`}
                        />
                        <div>{dayjs(exercise.date).format("YYYY-MM-DD")}</div>
                      </List.Item>
                    )}
                  />
                )
              )}
            </div>

            {/* "Add Exercise" button positioned at the bottom-right */}
            <Button
              type="primary"
              onClick={handleModalOpen}
              disabled={selectedUserId === null}
              style={{
                position: "absolute",
                bottom: "16px",
                right: "16px"
              }}
            >
              Add Exercise
            </Button>

            <Modal
              title="Add Exercise"
              open={isModalVisible}
              onCancel={handleModalClose}
              footer={[
                <Button key="cancel" onClick={handleModalClose}>
                  Cancel
                </Button>,
                <Button key="submit" type="primary" onClick={addExercise}>
                  Submit
                </Button>
              ]}
            >
              <Input
                placeholder="Exercise description"
                value={exerciseData.description}
                onChange={(e) =>
                  setExerciseData({
                    ...exerciseData,
                    description: e.target.value
                  })
                }
                style={{ marginBottom: "10px" }}
              />
              <Input
                placeholder="Duration (minutes)"
                type="number"
                value={exerciseData.duration}
                onChange={(e) =>
                  setExerciseData({ ...exerciseData, duration: e.target.value })
                }
                style={{ marginBottom: "10px" }}
              />
              <DatePicker
                placeholder="Select date"
                value={exerciseData.date}
                onChange={(date) => setExerciseData({ ...exerciseData, date })}
                style={{ width: "100%" }}
              />
            </Modal>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default App;

