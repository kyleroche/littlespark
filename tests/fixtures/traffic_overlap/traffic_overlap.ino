// Negative emulator fixture: two lights must never pass validation.
void setup() {
  pinMode(13, OUTPUT);
  pinMode(12, OUTPUT);
  digitalWrite(13, HIGH);
  digitalWrite(12, HIGH);
}
void loop() {}
