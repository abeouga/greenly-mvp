package jp.greenly.api.config;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile("e2e")
public class E2eDemoGardenOwner implements GardenOwner {
  @Override
  public String ownerId() {
    return "greenly-e2e-demo";
  }
}
