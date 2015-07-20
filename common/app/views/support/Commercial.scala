package views.support

import common.Edition
import conf.Switches._
import model.MetaData

object Commercial {

  def shouldShowAds(metaData: MetaData): Boolean = metaData match {
    case c: model.Content if c.shouldHideAdverts => false
    case p: model.Page if p.section == "identity" => false
    case _ => true
  }

  object topAboveNavSlot {

    private def isUKNetworkFront(metaData: MetaData) = metaData.id == "uk"

    def hasAd(metaData: MetaData): Boolean = {
      FixedTopAboveNavAdSlotSwitch.isSwitchedOff ||
        TopAboveNavAdSlotOmitSwitch.isSwitchedOff ||
        !isUKNetworkFront(metaData)
    }

    def adSizes(metaData: MetaData): Map[String, Seq[String]] = {
      Map(
        "mobile" -> Seq("1,1", "88,70", "728,90"),
        "desktop" -> {
          if (FixedTopAboveNavAdSlotSwitch.isSwitchedOn && isUKNetworkFront(metaData)) {
            if (TopAboveNavAdSlot728x90Switch.isSwitchedOn) {
              Seq("728,90")
            } else if (TopAboveNavAdSlot88x70Switch.isSwitchedOn) {
              Seq("88,70")
            } else {
              Seq("1,1", "900,250", "970,250")
            }
          } else {
            Seq("1,1", "88,70", "728,90", "940,230", "900,250", "970,250")
          }
        }
      )
    }

    def cssClasses(metaData: MetaData): String = {
      val classes = Seq(
        "top-banner-ad-container",
        "top-banner-ad-container--desktop",
        "top-banner-ad-container--above-nav")

      val sizeSpecificClass = {
        if (FixedTopAboveNavAdSlotSwitch.isSwitchedOn && isUKNetworkFront(metaData)) {
          if (TopAboveNavAdSlot728x90Switch.isSwitchedOn) {
            "top-banner-ad-container--medium"
          } else {
            "top-banner-ad-container--large"
          }
        } else {
          "top-banner-ad-container--reveal"
        }
      }

      (classes :+ sizeSpecificClass) mkString " "
    }
  }

  object topBelowNavSlot {

    def hasAd(metaData: MetaData, edition: Edition): Boolean = {
      metaData.hasAdInBelowTopNavSlot(edition)
    }
  }
}
