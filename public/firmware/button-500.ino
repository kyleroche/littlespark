// Push-button light: internal pull-up on D2
void setup() {
  pinMode(2, INPUT_PULLUP);
  pinMode(13, OUTPUT);
}

void loop() {
  bool pressed = digitalRead(2) == LOW;
  digitalWrite(13, pressed ? HIGH : LOW);
  delay(5); // Short settling wait
}
