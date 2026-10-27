// Traffic lights: red, green, yellow
void setup() {
  pinMode(13, OUTPUT); // Red
  pinMode(12, OUTPUT); // Yellow
  pinMode(11, OUTPUT); // Green
}

void loop() {
  digitalWrite(13, HIGH); // Stop
  delay(1000);
  digitalWrite(13, LOW);

  digitalWrite(11, HIGH); // Go
  delay(1000);
  digitalWrite(11, LOW);

  digitalWrite(12, HIGH); // Get ready to stop
  delay(500);
  digitalWrite(12, LOW);
}
